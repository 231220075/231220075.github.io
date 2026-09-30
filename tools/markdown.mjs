/**
 * 零依赖 Markdown 渲染器
 * 支持：标题 / 段落 / 列表(含嵌套与任务列表) / 引用 / 表格 / 代码块(带高亮) /
 *       行内代码 / 粗斜体 / 删除线 / 链接 / 图片 / 分割线 / 原始 HTML 透传
 * 不依赖任何 npm 包，保证多年后依然能跑。
 */

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
])
const RAW_TAGS = new Set(['script', 'style', 'pre', 'textarea'])

/* ------------------------------------------------------------------ */
/* 工具函数                                                            */
/* ------------------------------------------------------------------ */

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;')
}

/** 生成锚点 id，保留中文与字母数字，去掉 emoji 与标点 */
export function slugify(text) {
  const out = String(text)
    .replace(/<[^>]*>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u3000]+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
  return out || 'section'
}

/* ------------------------------------------------------------------ */
/* Front matter                                                        */
/* ------------------------------------------------------------------ */

/** 解析 --- 包裹的 YAML 头，只支持常见简单类型 */
export function parseFrontMatter(raw) {
  const text = String(raw).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const match = /^---\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(text)
  if (!match) return { data: {}, content: text }

  const data = {}
  const lines = match[1].split('\n')
  let key = null
  let listBuffer = null

  for (const line of lines) {
    if (!line.trim()) continue
    const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (kv) {
      if (listBuffer && key) { data[key] = listBuffer; listBuffer = null }
      key = kv[1]
      let value = kv[2].trim()
      if (value === '') {
        // 可能是列表或嵌套对象，先置空数组占位
        data[key] = ''
        listBuffer = []
        continue
      }
      // 行内数组写法：[a, b, c]（Hexo / YAML 都支持）
      if (/^\[[\s\S]*\]$/.test(value)) {
        const inner = value.slice(1, -1).trim()
        data[key] = inner === ''
          ? []
          : inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter((s) => s !== '')
        key = null
        continue
      }
      value = value.replace(/^["']|["']$/g, '')
      if (/^(true|false)$/i.test(value)) data[key] = value.toLowerCase() === 'true'
      else if (/^-?\d+(\.\d+)?$/.test(value)) data[key] = Number(value)
      else data[key] = value
      key = null
    } else if (/^\s*-\s+/.test(line) && listBuffer) {
      listBuffer.push(line.replace(/^\s*-\s+/, '').trim().replace(/^["']|["']$/g, ''))
    }
  }
  if (listBuffer && key) data[key] = listBuffer

  // 清理空占位
  for (const k of Object.keys(data)) if (data[k] === '') delete data[k]

  return { data, content: text.slice(match[0].length) }
}

/* ------------------------------------------------------------------ */
/* HTML 块识别                                                          */
/* ------------------------------------------------------------------ */

function isHtmlBlockStart(line) {
  const t = line.trimStart()
  if (!t.startsWith('<')) return false
  if (/^<!--/.test(t)) return true
  if (/^<[!?]/.test(t)) return true
  return /^<\/?[a-zA-Z][a-zA-Z0-9:-]*/.test(t)
}

const rawCloseCache = new Map()
function rawCloseRe(name) {
  let re = rawCloseCache.get(name)
  if (!re) {
    re = new RegExp(`</${name}\\s*>`, 'i')
    rawCloseCache.set(name, re)
  }
  return re
}

/**
 * 增量 HTML 扫描器：逐行喂入，实时跟踪标签深度。
 * 能正确处理跨行标签、跨行注释，以及 script/style/pre 中的原始内容
 * （原始内容里的 < > 不会被误判为标签）。
 */
function createHtmlScanner() {
  let depth = 0
  let pending = ''   // 跨行未闭合的标签片段
  let raw = null     // 正在读取内容的原始标签名
  let comment = false

  function processText(text) {
    let i = 0
    while (i < text.length) {
      if (raw) {
        const m = rawCloseRe(raw).exec(text.slice(i))
        if (!m) return
        i += m.index + m[0].length
        raw = null
        continue
      }
      if (comment) {
        const idx = text.indexOf('-->', i)
        if (idx === -1) return
        comment = false
        i = idx + 3
        continue
      }

      const lt = text.indexOf('<', i)
      if (lt === -1) return

      if (text.startsWith('<!--', lt)) {
        if (text.length - lt < 4) { pending = text.slice(lt); return }
        comment = true
        i = lt + 4
        continue
      }
      if (/^<[!?]/.test(text.slice(lt))) {
        const end = text.indexOf('>', lt)
        if (end === -1) { pending = text.slice(lt); return }
        i = end + 1
        continue
      }

      const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)/.exec(text.slice(lt, lt + 80))
      if (!m) { i = lt + 1; continue }

      const closing = m[1] === '/'
      const name = m[2].toLowerCase()

      // 找到标签的结束 '>'，忽略引号内的内容
      let j = lt + m[0].length
      let quote = null
      let closed = false
      while (j < text.length) {
        const c = text[j]
        if (quote) { if (c === quote) quote = null }
        else if (c === '"' || c === "'") quote = c
        else if (c === '>') { closed = true; break }
        j++
      }
      if (!closed) { pending = text.slice(lt); return }

      const selfClosing = /\/\s*$/.test(text.slice(lt, j))
      i = j + 1

      if (closing) {
        depth = Math.max(0, depth - 1)
      } else if (!selfClosing && !VOID_TAGS.has(name)) {
        if (RAW_TAGS.has(name)) raw = name
        else depth += 1
      }
    }
  }

  return {
    /** 喂入一行，返回是否仍处于未闭合的 HTML 块中 */
    feed(line) {
      const text = pending ? pending + line : line
      pending = ''
      processText(text)
      return depth > 0 || raw !== null || comment === true || pending !== ''
    },
  }
}

/** 从若干行中取出一个完整的 HTML 块，返回 [文本, 下一行索引] */
function consumeHtmlBlock(lines, start) {
  const scanner = createHtmlScanner()
  const buf = [lines[start]]
  let open = scanner.feed(lines[start])
  let i = start + 1
  while (open && i < lines.length) {
    buf.push(lines[i])
    open = scanner.feed(lines[i])
    i += 1
  }
  return [buf.join('\n'), i]
}

/* ------------------------------------------------------------------ */
/* 代码高亮                                                            */
/* ------------------------------------------------------------------ */

const KEYWORDS = {
  js: 'var let const function return if else for while do break continue new delete typeof instanceof class extends super this null undefined true false import export from default async await try catch finally throw switch case default yield static get set of in void',
  ts: 'var let const function return if else for while do break continue new delete typeof instanceof class extends super this null undefined true false import export from default async await try catch finally throw switch case default yield static get set of in void interface type enum implements public private protected readonly namespace declare any string number boolean unknown never as is',
  java: 'public private protected class interface extends implements static final void int long double float boolean char byte short if else for while do break continue return new this super null true false import package throws throw try catch finally switch case default abstract synchronized volatile transient native instanceof enum record var',
  py: 'def class return if elif else for while break continue import from as pass raise try except finally with lambda None True False and or not in is global nonlocal yield assert del async await self print',
  python: 'def class return if elif else for while break continue import from as pass raise try except finally with lambda None True False and or not in is global nonlocal yield assert del async await self print',
  go: 'package import func var const type struct interface return if else for range break continue go defer chan map make new nil true false switch case default select goto fallthrough',
  rust: 'fn let mut const static struct enum impl trait use mod pub crate super self match if else for while loop break continue return where as dyn async await move ref true false Some None Ok Err unsafe extern type',
  c: 'int long short char float double void signed unsigned struct union enum typedef static const extern return if else for while do break continue switch case default sizeof goto NULL',
  cpp: 'int long short char float double void bool struct class union enum typedef namespace using template typename public private protected virtual override final static const constexpr extern return if else for while do break continue switch case default new delete this nullptr true false auto try catch throw sizeof',
  cs: 'using namespace class struct interface public private protected internal static void int long double float bool string var return if else for foreach while do break continue switch case default new this null true false try catch finally throw async await override virtual abstract readonly',
  sh: 'if then else elif fi for while do done case esac function return echo export local readonly source cd exit set unset shift trap in',
  bash: 'if then else elif fi for while do done case esac function return echo export local readonly source cd exit set unset shift trap in',
  sql: 'SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP INDEX JOIN LEFT RIGHT INNER OUTER ON GROUP BY ORDER HAVING LIMIT OFFSET AS AND OR NOT NULL DISTINCT UNION ALL PRIMARY KEY FOREIGN REFERENCES DEFAULT COUNT SUM AVG MIN MAX',
  css: 'important media supports keyframes import charset',
  json: 'true false null',
  yaml: 'true false null yes no on off',
  php: 'echo function class return if else elseif for foreach while do break continue new public private protected static const namespace use try catch finally throw switch case default array null true false',
  kotlin: 'fun val var class object interface return if else for while do break continue when in is as null true false import package try catch finally throw',
}

const LANG_ALIAS = {
  javascript: 'js', jsx: 'js', mjs: 'js', cjs: 'js', node: 'js',
  typescript: 'ts', tsx: 'ts',
  'c++': 'cpp', cc: 'cpp', hpp: 'cpp', h: 'c',
  golang: 'go', rs: 'rust', py3: 'python', zsh: 'bash', shell: 'bash', console: 'bash',
  yml: 'yaml', mysql: 'sql', postgresql: 'sql', cs: 'cs', 'c#': 'cs',
}

const LANG_LABEL = {
  cpp: 'C++', cs: 'C#', sh: 'Shell', py: 'Python', ts: 'TypeScript', js: 'JavaScript',
}

function highlight(code, lang) {
  const raw = String(code)
  const key = LANG_ALIAS[lang] || lang
  const keywordList = KEYWORDS[key]

  // 不支持高亮的语言：只做转义
  if (!keywordList || ['html', 'xml', 'svg', 'plaintext', 'text', 'txt', 'md', 'markdown', 'diff'].includes(key)) {
    return escapeHtml(raw)
  }

  const keywords = new Set(keywordList.split(/\s+/).filter(Boolean))
  const hashComment = ['py', 'python', 'sh', 'bash', 'yaml', 'yml', 'rb', 'ruby', 'toml', 'ini', 'conf'].includes(key)
  const dashComment = key === 'sql'

  const parts = []
  parts.push(hashComment ? '#[^\\n]*' : (dashComment ? '--[^\\n]*' : '\\/\\/[^\\n]*'))
  parts.push('\\/\\*[\\s\\S]*?\\*\\/')
  parts.push('<!--[\\s\\S]*?-->')
  const commentPattern = `(?:${parts.join('|')})`

  const re = new RegExp(
    `(${commentPattern})` + // 1 注释
    `|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)` + // 2 字符串
    `|(\\b0[xXbB][0-9a-fA-F_]+\\b|\\b\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b)` + // 3 数字
    `|([A-Za-z_$][A-Za-z0-9_$]*)`, // 4 标识符
    'g',
  )

  let out = ''
  let last = 0
  let m
  while ((m = re.exec(raw)) !== null) {
    out += escapeHtml(raw.slice(last, m.index))
    last = m.index + m[0].length
    if (m[1]) out += `<span class="tok-com">${escapeHtml(m[1])}</span>`
    else if (m[2]) out += `<span class="tok-str">${escapeHtml(m[2])}</span>`
    else if (m[3]) out += `<span class="tok-num">${escapeHtml(m[3])}</span>`
    else if (m[4]) {
      const word = m[4]
      if (keywords.has(word)) out += `<span class="tok-kw">${word}</span>`
      else if (keywords.has(word.toLowerCase())) out += `<span class="tok-kw">${word}</span>`
      else if (key === 'sql' && keywords.has(word.toUpperCase())) out += `<span class="tok-kw">${word}</span>`
      else if (/^[A-Z][A-Z0-9_]*$/.test(word) && word.length > 2) out += `<span class="tok-const">${word}</span>`
      else out += word
    }
  }
  out += escapeHtml(raw.slice(last))
  return out
}

/* ------------------------------------------------------------------ */
/* 行内渲染                                                            */
/* ------------------------------------------------------------------ */

function renderInline(text) {
  let out = String(text)

  // 1. 抽出行内代码，避免其中内容被其它规则处理
  const codes = []
  out = out.replace(/`([^`\n]+)`/g, (_, code) => {
    codes.push(code)
    return `\u0000C${codes.length - 1}\u0000`
  })

  // 2. 转义（保留原始 HTML 标签）
  out = out.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;')
  out = out.replace(/<(?![/a-zA-Z!?])/g, '&lt;')

  // 3. 图片
  out = out.replace(
    /!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+["']([^"']*)["'])?\s*\)/g,
    (_, alt, src, title) =>
      `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${title ? ` title="${escapeAttr(title)}"` : ''} loading="lazy" class="md-img">`,
  )

  // 4. 链接（含 mailto / 锚点）
  out = out.replace(
    /\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+["']([^"']*)["'])?\s*\)/g,
    (_, label, href, title) => {
      const external = /^https?:\/\//i.test(href)
      const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeAttr(href)}"${title ? ` title="${escapeAttr(title)}"` : ''}${attrs}>${label}</a>`
    },
  )

  // 5. 自动链接 <https://...>
  out = out.replace(/<((?:https?:\/\/|mailto:)[^\s>]+)>/g, (_, url) =>
    `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${url}</a>`)

  // 6. 裸链接（仅在当前文本没有 <a 标签时处理，避免嵌套）
  if (!/<a[\s>]/i.test(out)) {
    out = out.replace(/(^|[\s(（])((?:https?:\/\/)[^\s<>"'）)，。]+)/g, (_, pre, url) =>
      `${pre}<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${url}</a>`)
  }

  // 7. 强调
  out = out.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>')
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^\w*])\*([^*\n]+)\*(?!\w)/g, '$1<em>$2</em>')
  out = out.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^\w_])_([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
  out = out.replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
  out = out.replace(/==([^=\n]+)==/g, '<mark>$1</mark>')

  // 8. 换行：行尾两个空格或反斜杠
  out = out.replace(/(?: {2,}|\\)\n/g, '<br>\n')

  // 9. 还原行内代码
  out = out.replace(/\u0000C(\d+)\u0000/g, (_, idx) => `<code class="inline-code">${escapeHtml(codes[Number(idx)])}</code>`)

  return out
}

/* ------------------------------------------------------------------ */
/* 块级解析                                                            */
/* ------------------------------------------------------------------ */

const RE_HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/
const RE_HR = /^\s{0,3}(?:(?:\*\s*){3,}|(?:-\s*){3,}|(?:_\s*){3,})$/
const RE_LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/

function indentWidth(line) {
  let w = 0
  for (const ch of line) {
    if (ch === ' ') w += 1
    else if (ch === '\t') w += 4
    else break
  }
  return w
}

function renderBlocks(lines, ctx) {
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行
    if (!line.trim()) { i++; continue }

    // 围栏代码块
    const fence = /^\s{0,3}(`{3,}|~{3,})\s*([^\s`]*)\s*(.*)$/.exec(line)
    if (fence) {
      const marker = fence[1][0]
      const lang = (fence[2] || '').toLowerCase()
      const meta = fence[3] || ''
      const buf = []
      i++
      while (i < lines.length) {
        const cur = lines[i]
        if (/^\s{0,3}(`{3,}|~{3,})\s*$/.test(cur) && cur.trim()[0] === marker) { i++; break }
        buf.push(cur)
        i++
      }
      const code = buf.join('\n')
      const label = LANG_LABEL[LANG_ALIAS[lang] || lang] || lang
      const title = meta.trim()
      out.push(
        `<figure class="code-block"${title ? ` data-title="${escapeAttr(title)}"` : ''}>` +
        `<figcaption class="code-head">` +
        `<span class="code-lang">${escapeHtml(title || label || 'code')}</span>` +
        `<button class="code-copy" type="button" data-copy>复制</button>` +
        `</figcaption>` +
        `<pre class="code-pre" data-lang="${escapeAttr(lang || 'text')}"><code>${highlight(code, lang)}</code></pre>` +
        `</figure>`,
      )
      continue
    }

    // HTML 块（按标签深度消费，容忍内部空行与跨行标签）
    if (isHtmlBlockStart(line)) {
      const [html, next] = consumeHtmlBlock(lines, i)
      out.push(html)
      i = next
      continue
    }

    // 标题
    const heading = RE_HEADING.exec(line)
    if (heading) {
      const level = heading[1].length
      const text = heading[2]
      const id = ctx.uniqueId(slugify(text))
      if (level <= 4) ctx.headings.push({ level, text: text.replace(/[*`_]/g, ''), id })
      out.push(`<h${level} id="${id}">${renderInline(text)}</h${level}>`)
      i++
      continue
    }

    // Setext 标题
    if (i + 1 < lines.length && line.trim() && /^\s{0,3}(=+|-{2,})\s*$/.test(lines[i + 1]) && !RE_LIST.test(line)) {
      const level = lines[i + 1].trim()[0] === '=' ? 1 : 2
      const id = ctx.uniqueId(slugify(line))
      if (level <= 4) ctx.headings.push({ level, text: line.trim(), id })
      out.push(`<h${level} id="${id}">${renderInline(line.trim())}</h${level}>`)
      i += 2
      continue
    }

    // 分割线
    if (RE_HR.test(line)) { out.push('<hr>'); i++; continue }

    // 引用块
    if (/^\s{0,3}>/.test(line)) {
      const buf = []
      while (i < lines.length && (/^\s{0,3}>/.test(lines[i]) || (lines[i].trim() && !/^\s{0,3}>/.test(lines[i]) && buf.length && !isHtmlBlockStart(lines[i]) && !RE_HEADING.test(lines[i])))) {
        if (/^\s{0,3}>/.test(lines[i])) buf.push(lines[i].replace(/^\s{0,3}>\s?/, ''))
        else buf.push(lines[i])
        i++
      }
      out.push(`<blockquote>${renderBlocks(buf, ctx)}</blockquote>`)
      continue
    }

    // 表格
    if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const splitRow = (row) => {
        let r = row.trim()
        if (r.startsWith('|')) r = r.slice(1)
        if (r.endsWith('|')) r = r.slice(0, -1)
        return r.split('|').map((c) => c.trim())
      }
      const head = splitRow(line)
      const aligns = splitRow(lines[i + 1]).map((c) => {
        const left = c.startsWith(':')
        const right = c.endsWith(':')
        if (left && right) return 'center'
        if (right) return 'right'
        if (left) return 'left'
        return ''
      })
      i += 2
      const rows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(splitRow(lines[i]))
        i++
      }
      const th = head.map((c, idx) => `<th${aligns[idx] ? ` style="text-align:${aligns[idx]}"` : ''}>${renderInline(c)}</th>`).join('')
      const tb = rows.map((r) =>
        `<tr>${head.map((_, idx) => `<td${aligns[idx] ? ` style="text-align:${aligns[idx]}"` : ''}>${renderInline(r[idx] || '')}</td>`).join('')}</tr>`,
      ).join('')
      out.push(`<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${tb}</tbody></table></div>`)
      continue
    }

    // 列表
    if (RE_LIST.test(line)) {
      const [html, next] = renderList(lines, i, ctx)
      out.push(html)
      i = next
      continue
    }

    // 缩进代码块
    if (/^ {4,}\S/.test(line)) {
      const buf = []
      while (i < lines.length && (/^ {4,}/.test(lines[i]) || !lines[i].trim())) {
        buf.push(lines[i].replace(/^ {4}/, ''))
        i++
      }
      while (buf.length && !buf[buf.length - 1].trim()) buf.pop()
      out.push(
        `<figure class="code-block"><figcaption class="code-head">` +
        `<span class="code-lang">code</span><button class="code-copy" type="button" data-copy>复制</button>` +
        `</figcaption><pre class="code-pre" data-lang="text"><code>${escapeHtml(buf.join('\n'))}</code></pre></figure>`,
      )
      continue
    }

    // 段落
    const buf = [line]
    i++
    while (i < lines.length && lines[i].trim() &&
      !RE_HEADING.test(lines[i]) && !RE_HR.test(lines[i]) &&
      !RE_LIST.test(lines[i]) && !/^\s{0,3}>/.test(lines[i]) &&
      !isHtmlBlockStart(lines[i]) &&
      !/^\s{0,3}(`{3,}|~{3,})/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]*\|?\s*$/.test(lines[i + 1]))) {
      buf.push(lines[i])
      i++
    }
    out.push(`<p>${renderInline(buf.join('\n'))}</p>`)
  }

  return out.join('\n')
}

/** 解析列表，返回 [html, 下一行索引] */
function renderList(lines, start, ctx) {
  const first = RE_LIST.exec(lines[start])
  const baseIndent = indentWidth(first[1])
  const ordered = /\d/.test(first[2])
  const startNum = ordered ? parseInt(first[2], 10) : 1
  const items = []
  let i = start

  while (i < lines.length) {
    const raw = lines[i]
    if (!raw.trim()) {
      // 空行：只有后面紧跟同层列表项时才继续
      let j = i + 1
      while (j < lines.length && !lines[j].trim()) j++
      if (j < lines.length) {
        const peek = RE_LIST.exec(lines[j])
        if (peek && indentWidth(peek[1]) >= baseIndent) { i = j; continue }
      }
      break
    }
    const m = RE_LIST.exec(raw)
    if (!m) break
    const indent = indentWidth(m[1])
    if (indent < baseIndent) break
    if (indent > baseIndent) break

    // 收集本项内容（含缩进的续行）
    let content = m[3]
    const subLines = []
    i++
    while (i < lines.length) {
      const cur = lines[i]
      if (!cur.trim()) {
        let j = i + 1
        while (j < lines.length && !lines[j].trim()) j++
        if (j < lines.length) {
          const peek = RE_LIST.exec(lines[j])
          const peekIndent = peek ? indentWidth(peek[1]) : indentWidth(lines[j])
          if (peekIndent > baseIndent) { subLines.push(''); i = j; continue }
        }
        break
      }
      const curIndent = indentWidth(cur)
      const curList = RE_LIST.exec(cur)
      if (curList && curIndent <= baseIndent) break
      if (!curList && curIndent <= baseIndent && !/^\s{2,}/.test(cur)) break
      subLines.push(cur.replace(new RegExp(`^ {0,${baseIndent + 2}}`), ''))
      i++
    }

    items.push([content, subLines])
  }

  const hasBlank = items.some(([, sub]) => sub.some((l) => !l.trim()))
  const taskRe = /^\[([ xX])\]\s+(.*)$/

  const html = items.map(([content, subLines]) => {
    const task = taskRe.exec(content)
    let inner
    if (task) {
      const checked = task[1].toLowerCase() === 'x'
      content = task[2]
      inner = `<input type="checkbox" disabled${checked ? ' checked' : ''}> `
    } else inner = ''

    const nested = subLines.filter((l) => l.trim()).length
      ? renderBlocks(subLines, ctx)
      : ''
    const text = renderInline(content)
    const tight = !hasBlank && !nested
    const body = tight ? `${inner}${text}${nested}` : `<p>${inner}${text}</p>${nested}`
    return `<li>${body}</li>`
  }).join('\n')

  const cls = ['md-list']
  if (items.some(([c]) => taskRe.test(c))) cls.push('task-list')
  const tag = ordered ? 'ol' : 'ul'
  const attr = ordered && startNum !== 1 ? ` start="${startNum}"` : ''
  return [`<${tag} class="${cls.join(' ')}"${attr}>\n${html}\n</${tag}>`, i]
}

/* ------------------------------------------------------------------ */
/* 对外接口                                                            */
/* ------------------------------------------------------------------ */

export function renderMarkdown(markdown) {
  const ctx = {
    headings: [],
    used: new Set(),
    uniqueId(base) {
      let id = base
      let n = 1
      while (this.used.has(id)) id = `${base}-${++n}`
      this.used.add(id)
      return id
    },
  }
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n')
  const html = renderBlocks(lines, ctx)
  return { html, headings: ctx.headings }
}

/** 生成文章纯文本摘要 */
export function extractText(markdown, length = 160) {
  const text = String(markdown)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[`*_>~#|-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > length ? `${text.slice(0, length)}…` : text
}
