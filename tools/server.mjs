/**
 * 本地预览服务器
 * - 支持无扩展名 URL（/about/ → about/index.html）
 * - content/ 有改动时自动重新构建，并让浏览器自动刷新
 *
 * 用法：node tools/server.mjs [端口]
 */

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'public')
const PORT = Number(process.argv[2] || process.env.PORT || 4000)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
}

const RELOAD_SNIPPET = `<script>
(function(){
  var es = new EventSource('/__reload');
  es.onmessage = function(){ location.reload(); };
})();
</script>`

let clients = []

function broadcast() {
  clients.forEach((res) => { try { res.write('data: reload\n\n') } catch (e) {} })
  clients = []
}

function safeJoin(base, target) {
  const resolved = path.resolve(base, '.' + path.posix.normalize('/' + target))
  return resolved.startsWith(base) ? resolved : null
}

function resolveFile(urlPath) {
  let decoded
  try { decoded = decodeURIComponent(urlPath.split('?')[0]) } catch (e) { decoded = urlPath.split('?')[0] }
  if (decoded.endsWith('/')) decoded += 'index.html'

  let file = safeJoin(OUT, decoded)
  if (!file) return null
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (fs.existsSync(file) && fs.statSync(file).isFile()) return file

  // 无扩展名时尝试补 .html / index.html
  if (!path.extname(file)) {
    if (fs.existsSync(file + '.html')) return file + '.html'
    if (fs.existsSync(path.join(file, 'index.html'))) return path.join(file, 'index.html')
  }
  return null
}

const server = http.createServer((req, res) => {
  if (req.url === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })
    res.write(': connected\n\n')
    clients.push(res)
    req.on('close', () => { clients = clients.filter((c) => c !== res) })
    return
  }

  let file = resolveFile(req.url)
  if (!file) {
    const custom404 = path.join(OUT, '404.html')
    if (fs.existsSync(custom404)) {
      res.writeHead(404, { 'Content-Type': MIME['.html'] })
      res.end(fs.readFileSync(custom404))
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('404 Not Found')
    }
    return
  }

  const ext = path.extname(file).toLowerCase()
  const type = MIME[ext] || 'application/octet-stream'

  if (ext === '.html') {
    let html = fs.readFileSync(file, 'utf8')
    html = html.replace('</body>', RELOAD_SNIPPET + '\n</body>')
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' })
    res.end(html)
    return
  }

  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' })
  fs.createReadStream(file).pipe(res)
})

/* ---------------- 监听文件变化并自动重建 ---------------- */

let building = false
let queued = false

function runBuild() {
  if (building) { queued = true; return }
  building = true
  const child = spawn(process.execPath, [path.join(__dirname, 'build.mjs')], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let out = ''
  child.stdout.on('data', (d) => { out += d })
  child.stderr.on('data', (d) => { out += d })
  child.on('close', (code) => {
    building = false
    process.stdout.write(out.split('\n').filter(Boolean).map((l) => '  ' + l).join('\n') + '\n')
    if (code === 0) broadcast()
    else console.log('  ⚠️  构建失败，请检查上面的错误信息')
    if (queued) { queued = false; runBuild() }
  })
}

const WATCH = ['content', 'assets', 'static', 'site.config.mjs']
let timer = null

function watchAll() {
  const handler = (event, filename) => {
    if (filename && filename.includes('.DS_Store')) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      console.log(`\n🔄 检测到改动，重新构建…`)
      runBuild()
    }, 250)
  }
  for (const target of WATCH) {
    const p = path.join(ROOT, target)
    if (!fs.existsSync(p)) continue
    try { fs.watch(p, { recursive: true }, handler) } catch (e) { fs.watch(p, handler) }
  }
}

server.listen(PORT, () => {
  console.log('')
  console.log(`  🚀 本地预览已启动：http://localhost:${PORT}`)
  console.log('  ✍️  修改 content/ 里的文章会自动重新构建并刷新页面')
  console.log('  ⏹  按 Ctrl+C 停止')
  console.log('')
  watchAll()
})
