/** Blog CLI. Node.js built-ins only. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { parseFrontMatter } from './markdown.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const POSTS = path.join(ROOT, 'content/posts')
const args = process.argv.slice(2)
const aliases = { n: 'new', b: 'build', s: 'dev', p: 'publish', del: 'rm', '-h': 'help', '--help': 'help' }
const rawCommand = args.shift() || 'help'
const command = aliases[rawCommand] || rawCommand
const pad = n => String(n).padStart(2, '0')
const now = () => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
const relative = file => path.relative(ROOT, file)

function fail(message) { throw new Error(message) }
function run(bin, argv, capture = false) {
  const result = spawnSync(bin, argv, { cwd: ROOT, stdio: capture ? 'pipe' : 'inherit', encoding: 'utf8' })
  if (result.error) fail(result.error.message)
  if (result.status !== 0) fail(capture ? (result.stderr.trim() || `${bin} 失败`) : `${bin} 失败 (${result.status ?? result.signal})`)
  return capture ? result.stdout.trim() : ''
}
function options(argv, allowed = []) {
  const values = {}, positional = []
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--') { positional.push(...argv.slice(i + 1)); break }
    if (!arg.startsWith('--')) { positional.push(arg); continue }
    const key = arg.slice(2)
    if (!allowed.includes(key)) fail(`未知选项：${arg}`)
    if (['tags', 'category', 'description', 'slug'].includes(key)) {
      const value = argv[++i]
      if (!value || value.startsWith('--')) fail(`${arg} 缺少值`)
      values[key] = value
    } else values[key] = true
  }
  return { values, positional }
}
function titleArg(positional) {
  if (positional.length !== 1 || !positional[0].trim()) fail('需要一个标题或文件名；含空格时请加引号。')
  return positional[0].trim()
}
function safeSlug(value) {
  const slug = value.normalize('NFC').trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '')
  if (!slug || /^\.+$/.test(slug) || slug.startsWith('.') || Buffer.byteLength(slug) > 240) fail('文件名无效或过长。')
  return slug
}
function posts() {
  if (!fs.existsSync(POSTS)) return []
  return fs.readdirSync(POSTS).filter(f => f.endsWith('.md') && !f.startsWith('.')).map(name => {
    const file = path.join(POSTS, name)
    if (fs.realpathSync(file) !== file) fail(`不支持文章符号链接：${name}`)
    const raw = fs.readFileSync(file, 'utf8')
    const { data } = parseFrontMatter(raw)
    return { file, name, slug: name.slice(0, -3), title: String(data.title || name.slice(0, -3)), data, raw }
  })
}
function resolvePost(query) {
  const all = posts()
  const exact = all.filter(p => [p.name, p.slug, p.title, relative(p.file), p.file].includes(query))
  const matches = exact.length ? exact : all.filter(p => `${p.title} ${p.slug}`.toLowerCase().includes(query.toLowerCase()))
  if (!matches.length) fail(`未找到：${query}`)
  if (matches.length > 1) fail('匹配多篇，请使用文件名：\n' + matches.map(p => `  ${relative(p.file)}`).join('\n'))
  return matches[0]
}
function updateFields(raw, fields) {
  const newline = raw.includes('\r\n') ? '\r\n' : '\n'
  const match = /^(\uFEFF?)---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw)
  // Publication dates and filenames are deliberately left intact.
  if (!match) fail('文章缺少 front matter；请先补充 title 和 date。')
  let header = match[2]
  for (const [key, value] of Object.entries(fields)) {
    const line = `${key}: ${value}`
    const pattern = new RegExp(`^${key}\\s*:.*$`, 'm')
    if (pattern.test(header)) header = header.replace(pattern, () => line)
    else header += newline + line
  }
  return `${match[1]}---${newline}${header}${newline}---${newline}${raw.slice(match[0].length)}`
}
function stamp(file, fields = {}) {
  const raw = fs.readFileSync(file, 'utf8')
  if (!parseFrontMatter(raw).data.date) fail('缺少 date；请先填写发布时间以保持文章 URL。')
  const updated = updateFields(raw, { updated: now(), ...fields })
  // Atomic replacement: a failed write leaves the original article intact.
  const temporary = `${file}.${process.pid}.tmp`
  try {
    fs.writeFileSync(temporary, updated, { flag: 'wx', mode: fs.statSync(file).mode })
    fs.renameSync(temporary, file)
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary) }
  console.log(`updated ${relative(file)}`)
}
function splitEditor(value) {
  // Quoted executable/arguments work; no shell expansion or evaluation.
  const parts = value.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || []
  return parts.map(part => part.replace(/"([^"]*)"|'([^']*)'/g, (_, double, single) => double ?? single))
}
function edit(file) {
  const before = fs.readFileSync(file, 'utf8')
  const editor = process.env.VISUAL || process.env.EDITOR
  if (editor) {
    const [bin, ...argv] = splitEditor(editor)
    if (!bin) fail('EDITOR 为空。')
    run(bin, [...argv, file])
  } else if (process.platform === 'darwin') run('open', ['-W', file])
  else if (process.stdin.isTTY) run('vi', [file])
  else fail('请设置 EDITOR，例如 EDITOR="code --wait"。')
  if (fs.readFileSync(file, 'utf8') !== before) stamp(file)
  else console.log('unchanged')
}
function newPost() {
  const { values, positional } = options(args, ['tags', 'category', 'description', 'slug', 'draft', 'edit'])
  const title = titleArg(positional)
  const slug = safeSlug(values.slug || title)
  const file = path.join(POSTS, `${slug}.md`)
  const fields = [`title: ${JSON.stringify(title)}`, `date: ${now()}`]
  if (values.tags) fields.push('tags:', ...values.tags.split(',').map(t => t.trim()).filter(Boolean).map(t => `  - ${JSON.stringify(t)}`))
  if (values.category) fields.push('categories:', `  - ${JSON.stringify(values.category)}`)
  if (values.description) fields.push(`description: ${JSON.stringify(values.description)}`)
  if (values.draft) fields.push('draft: true')
  fs.mkdirSync(POSTS, { recursive: true })
  try { fs.writeFileSync(file, `---\n${fields.join('\n')}\n---\n\n`, { flag: 'wx' }) }
  catch (e) { if (e.code === 'EEXIST') fail(`已存在：${relative(file)}`); throw e }
  console.log(`created ${relative(file)}`)
  if (values.edit) edit(file)
}
function updatePost() {
  const { values, positional } = options(args, ['edit', 'draft', 'no-draft'])
  if (values.draft && values['no-draft']) fail('--draft 与 --no-draft 不能同时使用。')
  const post = resolvePost(titleArg(positional))
  if (command === 'edit' || values.edit) edit(post.file)
  const fields = values.draft ? { draft: 'true' } : values['no-draft'] ? { draft: 'false' } : {}
  if ((command !== 'edit' && !values.edit) || Object.keys(fields).length) stamp(post.file, fields)
}
function listPosts() {
  const { positional } = options(args)
  if (positional.length > 1) fail('list [关键词]')
  const query = (positional[0] || '').toLowerCase()
  const list = posts().filter(p => `${p.title} ${p.slug}`.toLowerCase().includes(query))
  for (const p of list) console.log(`${p.data.draft === true ? 'draft' : 'post '}  ${String(p.data.date || '').slice(0, 10).padEnd(10)}  ${relative(p.file)}`)
  console.log(`${list.length} posts`)
}
function build() { run(process.execPath, ['tools/build.mjs']) }
function publish() {
  if (args.length > 1) fail('publish ["提交说明"]')
  const branch = run('git', ['branch', '--show-current'], true)
  if (!branch) fail('请先切换到一个分支。')
  run('git', ['remote', 'get-url', 'origin'], true)
  build()
  if (run('git', ['status', '--porcelain'], true)) {
    run('git', ['add', '-A'])
    run('git', ['commit', '-m', args[0] || `post: ${now().slice(0, 16)}`])
  }
  run('git', ['push', '-u', 'origin', branch])
  console.log(`pushed ${branch}`)
}
function help() {
  console.log(`blog <command>

  new "标题"             新建文章
    --tags Rust,Git       标签
    --category 技术       分类
    --description "摘要"  摘要
    --slug rust-notes     文件名
    --draft              草稿
    --edit               创建后编辑
  edit "标题或文件名"     编辑，保存后自动更新 updated
  update "标题或文件名"   记录更新时间；保持 date 和 URL
    --edit               同 edit
    --draft / --no-draft  设为草稿 / 准备发布
  list [关键词]          查找文章（含草稿）
  dev [端口]             本地预览，默认 4000
  build                  构建到 public/
  publish ["提交说明"]    构建、提交、推送
  status                 Git 状态
  rm "标题或文件名"       移到 .trash/
  clean                  清空 public/
  setup                  配置 origin（仅首次需要）
  help                   全部命令

编辑器：VISUAL / EDITOR（如 code --wait）；macOS 默认应用。`)
}

try {
  switch (command) {
    case 'new': newPost(); break
    case 'edit': case 'update': updatePost(); break
    case 'list': listPosts(); break
    case 'build': build(); break
    case 'dev': {
      if (args.length > 1 || (args[0] && !/^\d+$/.test(args[0]))) fail('dev [端口]')
      const port = Number(args[0] || 4000)
      if (port < 1 || port > 65535) fail('端口范围：1–65535。')
      build(); run(process.execPath, ['tools/server.mjs', String(port)]); break
    }
    case 'publish': publish(); break
    case 'status': run('git', ['status', '--short']); break
    case 'clean': fs.rmSync(path.join(ROOT, 'public'), { recursive: true, force: true }); console.log('cleaned public/'); break
    case 'rm': {
      const { positional } = options(args)
      const post = resolvePost(titleArg(positional))
      const trash = path.join(ROOT, '.trash')
      fs.mkdirSync(trash, { recursive: true })
      fs.renameSync(post.file, path.join(trash, `${post.slug}.${Date.now()}.md`))
      console.log(`removed ${relative(post.file)} → .trash/`); break
    }
    case 'setup': {
      run('git', ['rev-parse', '--git-dir'], true)
      const remote = spawnSync('git', ['remote', 'get-url', 'origin'], { cwd: ROOT, stdio: 'pipe' })
      if (remote.status !== 0) run('git', ['remote', 'add', 'origin', 'https://github.com/231220075/231220075.github.io.git'])
      console.log(run('git', ['remote', 'get-url', 'origin'], true)); break
    }
    case 'help': help(); break
    default: fail(`未知命令：${rawCommand}；使用 ./blog help。`)
  }
} catch (error) { console.error(`error: ${error.message}`); process.exitCode = 1 }
