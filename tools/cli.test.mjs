import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { parseFrontMatter } from './markdown.mjs'

const source = fileURLToPath(new URL('../', import.meta.url))
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'summer-flower-'))
  fs.mkdirSync(path.join(root, 'tools'))
  fs.mkdirSync(path.join(root, 'content/posts'), { recursive: true })
  for (const name of ['cli.mjs', 'build.mjs', 'markdown.mjs', 'output.mjs']) fs.copyFileSync(path.join(source, 'tools', name), path.join(root, 'tools', name))
  fs.cpSync(path.join(source, 'assets/js'), path.join(root, 'assets/js'), { recursive: true })
  fs.copyFileSync(path.join(source, 'site.config.mjs'), path.join(root, 'site.config.mjs'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  return {
    root,
    run(argv, env = {}) {
      return spawnSync(process.execPath, [path.join(root, 'tools/cli.mjs'), ...argv], {
        cwd: os.tmpdir(), encoding: 'utf8', env: { ...process.env, VISUAL: '', EDITOR: '', ...env },
      })
    },
    write(name, content) { fs.writeFileSync(path.join(root, 'content/posts', name + '.md'), content) },
    read(name) { return fs.readFileSync(path.join(root, 'content/posts', name + '.md'), 'utf8') },
  }
}
function ok(result) { assert.equal(result.status, 0, result.stderr || result.stdout) }

test('new handles quoted titles and metadata without prompts or overwrites', t => {
  const f = fixture(t)
  const title = 'CLI "notes": it\'s safe'
  ok(f.run(['new', title, '--slug', 'cli-notes', '--tags', 'Rust,Git', '--category', '技术', '--description', 'A "quote"']))
  const raw = f.read('cli-notes')
  const { data, content } = parseFrontMatter(raw)
  assert.equal(data.title, title)
  assert.equal(data.description, 'A "quote"')
  assert.deepEqual(data.tags, ['Rust', 'Git'])
  assert.deepEqual(data.categories, ['技术'])
  assert.equal(content.trim(), '')
  assert.equal(f.run(['new', 'Other title', '--slug', 'cli-notes']).status, 1)
  assert.equal(f.read('cli-notes'), raw)
  assert.equal(f.run(['new', '../outside']).status, 1)
  assert.equal(f.run(['new', 'Missing value', '--tags']).status, 1)
  assert.equal(fs.existsSync(path.join(f.root, 'outside.md')), false)
})

test('update preserves publication date, BOM, CRLF, metadata and body', t => {
  const f = fixture(t)
  const body = '\r\n## body\r\n\r\ntext updated: do not replace\r\n'
  f.write('old', '\uFEFF---\r\ntitle: Old\r\ndate: 2025-02-28 19:30\r\nupdated: 2025-02-28\r\ncover: /photos/old.jpg\r\n---\r\n' + body)
  ok(f.run(['update', 'Old']))
  const raw = f.read('old')
  assert.ok(raw.startsWith('\uFEFF---\r\n'))
  assert.ok(raw.endsWith(body))
  assert.ok(!/(?<!\r)\n/.test(raw))
  const { data } = parseFrontMatter(raw)
  assert.equal(data.date, '2025-02-28 19:30')
  assert.equal(data.cover, '/photos/old.jpg')
  assert.notEqual(data.updated, '2025-02-28')
  assert.equal((raw.match(/^updated:/gm) || []).length, 1)
})

test('ambiguous matches and malformed articles fail without mutations', t => {
  const f = fixture(t)
  f.write('one', '---\ntitle: Rust one\ndate: 2025-01-01\n---\nFirst')
  f.write('two', '---\ntitle: Rust two\ndate: 2025-01-02\n---\nSecond')
  const before = f.read('one')
  const result = f.run(['update', 'Rust'])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /匹配多篇/)
  assert.equal(f.read('one'), before)
  f.write('broken', 'no front matter')
  assert.equal(f.run(['update', 'broken']).status, 1)
  assert.equal(f.read('broken'), 'no front matter')
  f.write('undated', '---\ntitle: Undated\n---\nBody')
  assert.equal(f.run(['update', 'undated']).status, 1)
  assert.equal(f.read('undated'), '---\ntitle: Undated\n---\nBody')
})

test('edit waits for an editor, preserves URLs and stamps only changed content', t => {
  const f = fixture(t)
  f.write('old', '---\ntitle: Old\ndate: 2025-01-02\n---\nOriginal\n')
  const helper = path.join(f.root, 'editor with spaces.mjs')
  fs.writeFileSync(helper, 'import fs from "node:fs"; fs.appendFileSync(process.argv.at(-1), "Saved\\n")')
  ok(f.run(['edit', 'old.md'], { EDITOR: `"${process.execPath}" "${helper}"` }))
  const changed = f.read('old')
  assert.match(changed, /Saved\n$/)
  assert.equal(parseFrontMatter(changed).data.date, '2025-01-02')
  assert.ok(parseFrontMatter(changed).data.updated)
  fs.writeFileSync(helper, '')
  ok(f.run(['edit', 'content/posts/old.md'], { EDITOR: `"${process.execPath}" "${helper}"` }))
  assert.equal(f.read('old'), changed)
})

test('drafts stay out of all outputs; update keeps the existing public URL', t => {
  const f = fixture(t)
  f.write('stable', '---\ntitle: Public post\ndate: 2025-02-28 19:30\n---\nVisible marker')
  ok(f.run(['new', 'Secret draft', '--slug', 'secret', '--draft']))
  ok(f.run(['build']))
  const read = file => fs.readFileSync(path.join(f.root, 'public', file), 'utf8')
  for (const file of ['index.html', 'archives/index.html', 'vfs.json', 'search.json', 'sitemap.xml']) assert.doesNotMatch(read(file), /Secret draft/)
  assert.ok(fs.existsSync(path.join(f.root, 'public/2025/02/28/stable/index.html')))
  ok(f.run(['update', 'stable']))
  ok(f.run(['update', 'secret', '--no-draft']))
  ok(f.run(['build']))
  assert.ok(fs.existsSync(path.join(f.root, 'public/2025/02/28/stable/index.html')))
  assert.match(read('search.json'), /Secret draft/)
})

test('list includes drafts and rm moves only the resolved post to trash', t => {
  const f = fixture(t)
  ok(f.run(['new', 'Keep']))
  ok(f.run(['new', 'Remove', '--draft']))
  const list = f.run(['list'])
  ok(list)
  assert.match(list.stdout, /draft.*Remove\.md/)
  ok(f.run(['rm', 'Remove']))
  assert.ok(f.read('Keep'))
  assert.equal(fs.existsSync(path.join(f.root, 'content/posts/Remove.md')), false)
  assert.equal(fs.readdirSync(path.join(f.root, '.trash')).length, 1)
  assert.equal(f.run(['rm', '../../Keep']).status, 1)
})

test('a failed build preserves the last successful site and removes staging files', t => {
  const f = fixture(t)
  f.write('stable', '---\ntitle: Stable\ndate: 2025-01-02\n---\nKeep this version')
  ok(f.run(['build']))
  const before = fs.readFileSync(path.join(f.root, 'public/index.html'), 'utf8')
  f.write('collision', '---\ntitle: Collision\ndate: 2025-01-03\ntags:\n  - Duplicate tag\n  - Duplicate-tag\n---\nBoth tags resolve to the same URL')
  assert.equal(f.run(['build']).status, 1)
  assert.equal(fs.readFileSync(path.join(f.root, 'public/index.html'), 'utf8'), before)
  assert.deepEqual(fs.readdirSync(f.root).filter(name => name.startsWith('.blog-build-')), [])
})

test('a failed output update rolls back regenerated files and newly created routes', { skip: process.platform === 'win32' }, t => {
  const f = fixture(t)
  f.write('stable', '---\ntitle: Stable\ndate: 2025-01-02\n---\nPrevious version')
  ok(f.run(['build']))
  const output = path.join(f.root, 'public')
  const article = path.join(output, '2025/01/02/stable/index.html')
  const before = fs.readFileSync(article, 'utf8')
  const fifo = path.join(output, 'stale-fifo')
  assert.equal(spawnSync('mkfifo', [fifo]).status, 0)
  f.write('stable', '---\ntitle: Stable\ndate: 2025-01-02\n---\nChanged version')
  f.write('new', '---\ntitle: New\ndate: 2025-01-03\n---\nNew route')
  const result = f.run(['build'])
  assert.equal(result.status, 1)
  assert.match(result.stderr, /stale-fifo/)
  assert.equal(fs.readFileSync(article, 'utf8'), before)
  assert.equal(fs.existsSync(path.join(output, '2025/01/03')), false)
  assert.ok(fs.lstatSync(fifo).isFIFO())
  assert.deepEqual(fs.readdirSync(f.root).filter(name => name.startsWith('.blog-build-')), [])
})

test('home exposes a plain shell prompt and builds a flat post directory with tag and category views', t => {
  const f = fixture(t)
  f.write('多分类笔记', '---\ntitle: 多分类笔记\ndate: 2025-01-02\ncategories:\n  - 学习记录\n  - 技术\ntags:\n  - Rust\n---\nBody')
  f.write('uncategorized', '---\ntitle: Uncategorized\ndate: 2025-01-03\n---\nBody')
  f.write('env-controller', '---\ntitle: Env Controller\ndate: 2026-11-18\ncategories:\n  - 技术\n---\nBody')
  f.write('hidden', '---\ntitle: Hidden\ndate: 2027-01-02\ncategories:\n  - Secret\ndraft: true\n---\nBody')
  ok(f.run(['build']))
  const output = path.join(f.root, 'public')
  const home = fs.readFileSync(path.join(output, 'index.html'), 'utf8')
  const main = /<main[\s\S]*?<\/main>/.exec(home)[0]
  assert.doesNotMatch(main, /<button|placeholder="输入命令"/)
  assert.match(main, /<h1 class="visually-hidden">Summer Flower<\/h1>/)
  assert.match(main, /<dt>Posts<\/dt><dd><a href="\/archives\/" data-command="ls -l ~\/posts"/)
  assert.match(main, /href="\/settings\/">settings<\/a>/)
  assert.match(main, /class="prompt-glyph" aria-hidden="true">&gt;&gt;<\/span>/)
  assert.ok(main.indexOf('data-startup') < main.indexOf('class="command-output"'))
  assert.ok(main.indexOf('class="command-output"') < main.indexOf('class="command-form"'))
  const archive = fs.readFileSync(path.join(output, 'archives/index.html'), 'utf8')
  assert.match(archive, /href="\/2026\/11\/18\/env-controller\/">Env Controller/)
  const article = fs.readFileSync(path.join(output, '2026/11/18/env-controller/index.html'), 'utf8')
  const articleTop = article.slice(0, article.indexOf('<article class="article">'))
  assert.doesNotMatch(articleTop, /class="command-entry"|cat env-controller\.md/)
  assert.equal((articleTop.match(/class="prompt-glyph"/g) || []).length, 1)
  assert.match(articleTop, /class="command-form"[\s\S]*href="\/archives\/">\/posts<\/a>/)
  const vfs = JSON.parse(fs.readFileSync(path.join(output, 'vfs.json'), 'utf8'))
  assert.deepEqual(vfs['/'].entries.find(entry => entry.name === 'settings'), {
    type: 'file', name: 'settings', title: '配色设置', url: '/settings/',
  })
  const settings = fs.readFileSync(path.join(output, 'settings/index.html'), 'utf8')
  assert.match(settings, /cat settings/)
  assert.deepEqual([...settings.matchAll(/name="theme" value="([^"]+)"/g)].map(match => match[1]),
    ['dark', 'slate', 'roast', 'dusk', 'light', 'auto'])
  const search = JSON.parse(fs.readFileSync(path.join(output, 'search.json'), 'utf8'))
  assert.deepEqual(vfs['/posts'].entries.map(file => file.name), ['env-controller.md', 'uncategorized.md', '多分类笔记.md'])
  assert.deepEqual(search.map(entry => entry.path), ['posts/env-controller.md', 'posts/uncategorized.md', 'posts/多分类笔记.md'])
  assert.deepEqual(new Set(vfs['/categories'].entries.map(entry => entry.name)), new Set(['学习记录', '技术', '未分类']))
  assert.equal(vfs['/categories/未分类'].entries[0].name, 'uncategorized.md')
  assert.deepEqual(vfs['/tags/Rust'].entries[0], vfs['/posts'].entries[2])
  assert.deepEqual(vfs['/categories/学习记录'].entries[0], vfs['/posts'].entries[2])
  assert.doesNotMatch(home + JSON.stringify(vfs), /Hidden|Secret/)
  const proj = fs.readFileSync(path.join(output, 'proj/index.html'), 'utf8')
  const firstProject = /<article class="project[^>]*>[\s\S]*?<\/article>/.exec(proj)[0]
  assert.match(firstProject, /<h2>Env Controller<\/h2>/)
  assert.match(firstProject, /href="\/2026\/11\/18\/env-controller\/">项目文章/)
  assert.match(firstProject, /href="https:\/\/github\.com\/231220075\/env-controller"[^>]*>GitHub 源码/)
  assert.match(firstProject, /href="https:\/\/github\.com\/231220075\/env-controller\/releases\/download\//)
  for (const repo of ['231220075/edge-orchestrator', '231220075/git', 'gitmono-dev/mega']) assert.ok(proj.includes('https://github.com/' + repo))
  fs.writeFileSync(path.join(output, 'stale.html'), 'old build output')
  const outputInode = fs.statSync(output).ino
  const homeInode = fs.statSync(path.join(output, 'index.html')).ino
  ok(f.run(['build']))
  assert.equal(fs.existsSync(path.join(output, 'stale.html')), false)
  assert.equal(fs.statSync(output).ino, outputInode)
  assert.equal(fs.statSync(path.join(output, 'index.html')).ino, homeInode)
  ok(f.run(['clean']))
  assert.equal(fs.statSync(output).ino, outputInode)
  assert.deepEqual(fs.readdirSync(output), [])
})
