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
  for (const name of ['cli.mjs', 'build.mjs', 'markdown.mjs']) fs.copyFileSync(path.join(source, 'tools', name), path.join(root, 'tools', name))
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
  for (const file of ['index.html', 'archives/index.html', 'search.json', 'atom.xml', 'sitemap.xml']) assert.doesNotMatch(read(file), /Secret draft/)
  assert.ok(fs.existsSync(path.join(f.root, 'public/2025/02/28/stable/index.html')))
  ok(f.run(['update', 'stable']))
  ok(f.run(['update', 'secret', '--no-draft']))
  ok(f.run(['build']))
  assert.ok(fs.existsSync(path.join(f.root, 'public/2025/02/28/stable/index.html')))
  assert.match(read('search.json'), /Secret draft/)
  assert.match(read('atom.xml'), /Secret draft/)
  for (const file of ['browser/index.html', 'games/index.html', 'manifest.json', 'js/pwa-install.js', 'upload/index.html', 'comments/index.html']) assert.equal(fs.existsSync(path.join(f.root, 'public', file)), false)
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
  const config = path.join(f.root, 'site.config.mjs')
  fs.writeFileSync(config, fs.readFileSync(config, 'utf8').replace('nav: [', 'invalidNav: ['))
  assert.equal(f.run(['build']).status, 1)
  assert.equal(fs.readFileSync(path.join(f.root, 'public/index.html'), 'utf8'), before)
  assert.deepEqual(fs.readdirSync(f.root).filter(name => name.startsWith('.blog-build-')), [])
})
