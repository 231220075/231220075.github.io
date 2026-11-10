/**
 * 站点生成器 —— 零依赖
 * 读取 content/ + assets/ + static/，输出完整静态站点到 public/
 *
 * 用法：node tools/build.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../site.config.mjs'
import { renderMarkdown, parseFrontMatter, extractText, escapeHtml } from './markdown.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DEST = path.join(ROOT, 'public')
const OUT = path.join(ROOT, `.blog-build-${process.pid}`)

/* ================================================================== */
/* 工具                                                                */
/* ================================================================== */

const pad = (n) => String(n).padStart(2, '0')

function toDate(value, fallback) {
  if (!value) return fallback || new Date()
  if (value instanceof Date) return value
  const s = String(value).trim()
  const m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(s)
  if (m) {
    const d = new Date(
      Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0),
    )
    if (!isNaN(d.getTime())) return d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? (fallback || new Date()) : d
}

function fmtDate(d, style) {
  const y = d.getFullYear(), mo = pad(d.getMonth() + 1), da = pad(d.getDate())
  if (style === 'iso') return `${y}-${mo}-${da}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}+08:00`
  if (style === 'short') return `${mo}-${da}`
  return `${y}-${mo}-${da}`
}

/** 生成可安全放进 href 的地址（中文/空格/特殊字符会被编码） */
function link(u) {
  return String(u).split('/').map((seg) => encodeURIComponent(seg)).join('/')
}

/** 标签 / 分类的目录名（去掉路径分隔符与空格，避免生成嵌套目录）
 *  空格换成连字符：GitHub Pages → GitHub-Pages（与旧站 Hexo 的 URL 保持一致） */
function termSlug(name) {
  return String(name)
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim() || 'unknown'
}

function termUrl(kind, name) {
  return `/${kind}/${termSlug(name)}/`
}

function write(file, content) {
  const target = path.join(OUT, file)
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.writeFileSync(target, content, 'utf8')
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.writeFileSync(d, fs.readFileSync(s))
  }
}

function readingTime(text) {
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = (text.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length
  const minutes = Math.ceil(cjk / 350 + words / 200)
  return Math.max(1, minutes)
}

/** 统一的站点绝对地址（已做 URL 编码） */
function absUrl(rel) {
  const base = config.siteUrl.replace(/\/$/, '')
  return base + link(rel)
}

/* ================================================================== */
/* 图标                                                                */
/* ================================================================== */

const S = (d, extra) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra || ''}>${d}</svg>`

const ICONS = {
  book: S('<path d="M4 5h16v15H4zM8 5v15"/>'),
  arrowUp: S('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  folder: S('<path d="M3 7h6l2 2h10v11H3z"/>'),
  tag: S('<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7" cy="7" r="1"/>'),
  message: S('<path d="M3 4h18v14H8l-5 3z"/>'),
}

const icon = (name) => ICONS[name] || ICONS.book

/* ================================================================== */
/* 布局                                                                */
/* ================================================================== */

const accentCss = `:root{--accent:${config.accent};}`

const themeBoot = `(function(){try{var m=localStorage.getItem('sf-theme')||'dark';var d=m==='dark'||(m==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`

function siteScript() {
  return `window.__SITE__=${JSON.stringify({
    features: config.features,
    searchPath: '/search.json',
    github: config.github,
    email: config.email,
  })};`
}

function renderHeader() {
  return `<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/" aria-label="${escapeHtml(config.title)} 首页"><span class="brand-prompt">&gt;_</span> <span>summer<span class="brand-slash">/</span>flower</span></a>
    <nav class="nav" aria-label="主导航">${config.nav.map((item) => `<a class="nav-link" href="${item.url}">${escapeHtml(item.name)}</a>`).join('')}</nav>
    <div class="header-actions">
      <button type="button" class="text-btn" data-command="help">help</button>
      ${config.features.darkMode ? '<button class="text-btn theme-toggle" type="button" data-theme-toggle aria-label="切换主题">light</button>' : ''}
    </div>
  </div>
</header>`
}

function renderTerminal() {
  return `<section class="terminal" aria-label="博客命令行">
  <form class="command-form" autocomplete="off">
    <label class="prompt" for="command-input"><span class="prompt-user">${escapeHtml(config.author)}</span><span class="prompt-path">:~</span> $</label>
    <input id="command-input" class="command-input" name="command" placeholder="help" aria-label="输入命令，help 查看帮助" spellcheck="false" autocapitalize="off" autocorrect="off">
    <button class="command-run" type="submit" aria-label="执行命令">↵</button>
  </form>
  <div class="command-output" role="region" aria-label="命令输出" aria-live="polite" hidden></div>
  <noscript><p class="terminal-noscript"><a href="/help/">help → 全部功能</a></p></noscript>
</section>`
}

function renderFooter() {
  const year = new Date().getFullYear()
  const since = config.footer.since
  return `<footer class="site-footer"><div class="footer-inner">
    <span>© ${since}${year > since ? `–${year}` : ''} ${escapeHtml(config.author)}</span>
    <div class="footer-links"><a href="/atom.xml">rss</a><a href="${config.github}" target="_blank" rel="noopener">github ↗</a><a href="mailto:${config.email}">email ↗</a></div>
    ${config.footer.icp ? `<span>${escapeHtml(config.footer.icp)}</span>` : ''}
  </div></footer>`
}

function renderShell({ title, description, url, content, bodyClass, extraHead }) {
  const fullTitle = title ? `${escapeHtml(title)} | ${escapeHtml(config.title)}` : `${escapeHtml(config.title)} - ${escapeHtml(config.subtitle)}`
  const desc = description || config.description
  const canonical = absUrl(url)

  return `<!DOCTYPE html>
<html lang="${config.lang}" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${fullTitle}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta name="author" content="${escapeHtml(config.author)}">
<meta name="keywords" content="${escapeHtml((config.keywords || []).join(','))}">
<meta name="theme-color" content="#111413">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title || config.title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${escapeHtml(config.title)}">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${config.favicon}">
<link rel="alternate" type="application/atom+xml" href="/atom.xml" title="${escapeHtml(config.title)}">
<link rel="stylesheet" href="/css/style.css">
<style>${accentCss}</style>
<script>${themeBoot}</script>
<script>${siteScript()}</script>
${extraHead || ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip-link" href="#main">跳到主要内容</a>
<div class="progress-bar"></div>
${renderHeader()}
<main class="site-main" id="main">
${bodyClass === 'is-home' ? '' : `<div class="container">${renderTerminal()}</div>`}
${content}
</main>
${renderFooter()}
<button class="back-top" type="button" aria-label="回到顶部">${icon('arrowUp')}</button>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="图片预览">
  <button class="lightbox-close" type="button" aria-label="关闭">✕</button>
  <img src="" alt="">
</div>
<script src="/js/main.js" defer></script>
</body>
</html>`
}

/* ================================================================== */
/* 内容加载                                                            */
/* ================================================================== */

function loadPosts() {
  const dir = path.join(ROOT, 'content', 'posts')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const stat = fs.statSync(path.join(dir, file))
      const { data, content } = parseFrontMatter(raw)
      if (data.draft === true) return null
      const slug = file.replace(/\.md$/, '')
      const date = toDate(data.date, stat.mtime)
      const { html, headings } = renderMarkdown(content)
      const plain = extractText(content, 100000)
      return {
        slug,
        file,
        title: data.title || slug,
        date,
        updated: data.updated ? toDate(data.updated, date) : date,
        tags: [].concat(data.tags || []).filter(Boolean),
        categories: [].concat(data.categories || []).filter(Boolean),
        description: data.description || '',
        cover: data.cover || '',
        comments: data.comments !== false,
        html,
        headings,
        plain,
        excerpt: data.description || extractText(content, 165),
        minutes: readingTime(plain),
        url: `/${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${slug}/`,
      }
    })
    .filter(Boolean)
    .sort((a, b) => b.date - a.date)
}

function loadPages() {
  const dir = path.join(ROOT, 'content', 'pages')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('.'))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), 'utf8')
      const { data, content } = parseFrontMatter(raw)
      const slug = file.replace(/\.md$/, '')
      const { html, headings } = renderMarkdown(content)
      return {
        slug,
        title: data.title || slug,
        description: data.description || '',
        date: toDate(data.date, new Date()),
        comments: data.comments === true,
        html,
        headings,
        url: `/${slug}/`,
      }
    })
}

/* ================================================================== */
/* 组件                                                                */
/* ================================================================== */

function postCard(post) {
  const tags = post.tags.slice(0, 2).map((t) => `<a class="post-tag" href="${link(termUrl('tags', t))}">#${escapeHtml(t)}</a>`).join(' ')
  return `<article class="post-card">
  <time class="post-date" datetime="${fmtDate(post.date)}">${fmtDate(post.date)}</time>
  <div class="post-card-body">
    <h3 class="post-card-title"><a href="${link(post.url)}">${escapeHtml(post.title)}</a></h3>
    <p class="post-card-excerpt">${escapeHtml(post.excerpt)}</p>
    <div class="post-card-meta">${tags}<span>${post.minutes} min read</span></div>
  </div>
  <a class="post-arrow" href="${link(post.url)}" aria-label="阅读 ${escapeHtml(post.title)}">↗</a>
</article>`
}

function pagination(page, totalPages, baseUrl) {
  if (totalPages <= 1) return ''
  const urlFor = (n) => (n === 1 ? baseUrl : `${baseUrl}page/${n}/`)
  const parts = []

  if (page > 1) parts.push(`<a class="page-link" href="${urlFor(page - 1)}">上一页</a>`)

  const nums = new Set([1, totalPages])
  for (let i = page - 2; i <= page + 2; i++) if (i >= 1 && i <= totalPages) nums.add(i)
  const sorted = [...nums].sort((a, b) => a - b)

  let prev = 0
  for (const n of sorted) {
    if (prev && n - prev > 1) parts.push('<span class="page-gap">…</span>')
    parts.push(n === page
      ? `<span class="page-current">${n}</span>`
      : `<a class="page-link" href="${urlFor(n)}">${n}</a>`)
    prev = n
  }

  if (page < totalPages) parts.push(`<a class="page-link" href="${urlFor(page + 1)}">下一页</a>`)
  return `<nav class="pagination">${parts.join('')}</nav>`
}

function renderToc(headings) {
  const list = (headings || []).filter((h) => h.level >= 2 && h.level <= 4)
  if (!list.length) return ''
  return `<aside class="toc" aria-label="目录">
  <p class="toc-title"># 目录</p>
  <ol>
    ${list.map((h) => `<li class="lvl-${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('\n')}
  </ol>
</aside>`
}

function giscusBlock(term) {
  const g = config.giscus || {}
  if (!g.enable) return ''
  return `<section class="comments" id="comments">
  <h3>${icon('message')} 评论</h3>
  <div class="giscus-wrap" data-giscus
    data-repo="${g.repo}"
    data-repo-id="${g.repoId}"
    data-category="${g.category}"
    data-category-id="${g.categoryId}"
    data-mapping="${term ? 'specific' : g.mapping}"
    data-term="${term ? escapeHtml(term) : ''}"></div>
</section>`
}

/* ================================================================== */
/* 页面生成                                                            */
/* ================================================================== */

function buildHome(posts) {
  const perPage = config.postsPerPage || 8
  const totalPages = Math.max(1, Math.ceil(posts.length / perPage))

  for (let page = 1; page <= totalPages; page++) {
    const slice = posts.slice((page - 1) * perPage, page * perPage)
    const hero = page === 1 ? `<section class="hero">
    <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> ${escapeHtml(config.author)} / personal log</p>
    <h1 class="hero-title">${escapeHtml(config.title)}<span class="accent">.</span></h1>
    <p class="hero-sub">${escapeHtml(config.subtitle)}</p>
    <div class="hero-note"><span>// 保持好奇，持续记录。</span><a href="/about/">whoami ↗</a></div>
  </section>` : ''

    const content = `<div class="container">
  ${hero}
  ${renderTerminal()}
  <div class="section-head">
    <h2><span class="muted">$</span> ls ./posts</h2>
    <span class="count">${posts.length} entries${page > 1 ? ` / page ${page}` : ''}</span>
  </div>
  <div class="post-list">${slice.length ? slice.map(postCard).join('\n') : '<p class="empty-state">暂无文章。</p>'}</div>
  ${pagination(page, totalPages, '/')}
  <a class="archive-link" href="/archives/">查看全部归档 <span>→</span></a>
</div>`

    const file = page === 1 ? 'index.html' : `page/${page}/index.html`
    const url = page === 1 ? '/' : `/page/${page}/`
    write(file, renderShell({
      title: page === 1 ? '' : `第 ${page} 页`,
      bodyClass: 'is-home',
      url,
      content,
    }))
  }
}

function buildPost(post, posts) {
  const index = posts.findIndex((p) => p.slug === post.slug)
  const newer = index > 0 ? posts[index - 1] : null
  const older = index < posts.length - 1 ? posts[index + 1] : null

  const tags = post.tags.map((t) =>
    `<a class="tag-chip" href="${link(termUrl('tags', t))}"># ${escapeHtml(t)}</a>`).join('')
  const cats = post.categories.map((c) =>
    `<a class="tag-chip" href="${link(termUrl('categories', c))}">${icon('folder')} ${escapeHtml(c)}</a>`).join('')

  const navPrev = older
    ? `<a href="${link(older.url)}"><span class="nav-label">← 上一篇</span><span class="nav-title">${escapeHtml(older.title)}</span></a>`
    : '<span class="placeholder"></span>'
  const navNext = newer
    ? `<a class="next" href="${link(newer.url)}"><span class="nav-label">下一篇 →</span><span class="nav-title">${escapeHtml(newer.title)}</span></a>`
    : '<span class="placeholder"></span>'

  const related = config.features.relatedPosts ? relatedPosts(post, posts) : ''

  const article = `<article class="article">
  <header class="article-header">
    <a class="back-link" href="/">← posts</a>
    <h1 class="article-title">${escapeHtml(post.title)}</h1>
    <div class="article-meta">
      <span class="meta-item">${icon('calendar')}${fmtDate(post.date)}</span>
      ${fmtDate(post.updated) !== fmtDate(post.date) ? `<span class="meta-item">${icon('clock')}updated ${fmtDate(post.updated)}</span>` : ''}
      <span class="meta-item">${icon('book')}${post.minutes} min read</span>
    </div>
    ${tags || cats ? `<div class="article-tags tag-chips">${cats}${tags}</div>` : ''}
  </header>
  <div class="article-body">
    ${post.html}
  </div>
  <nav class="post-nav">${navPrev}${navNext}</nav>
</article>`

  const content = `<div class="container">
  <div class="post-layout">
    ${article}
    ${config.features.toc ? renderToc(post.headings) : ''}
  </div>
  ${related}
  ${post.comments ? giscusBlock() : ''}
</div>`

  write(path.join(post.url.replace(/^\//, ''), 'index.html'), renderShell({
    title: post.title,
    description: post.excerpt,
    url: post.url,
    content,
    bodyClass: 'is-post',
    extraHead: `<meta property="og:type" content="article">
<meta property="article:published_time" content="${fmtDate(post.date, 'iso')}">
<meta property="article:author" content="${escapeHtml(config.author)}">`,
  }))
}

function relatedPosts(post, posts) {
  const scored = posts
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = 0
      p.tags.forEach((t) => { if (post.tags.includes(t)) score += 3 })
      p.categories.forEach((c) => { if (post.categories.includes(c)) score += 2 })
      return { post: p, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.post.date - a.post.date)
    .slice(0, 3)

  if (!scored.length) return ''
  return `<div class="container">
  <div class="section-head">
    <h2>相关文章</h2>
    <span class="line"></span>
  </div>
  <div class="post-list">
    ${scored.map((x) => postCard(x.post)).join('\n')}
  </div>
</div>`
}

function buildArchives(posts) {
  const byYear = new Map()
  posts.forEach((p) => {
    const y = p.date.getFullYear()
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y).push(p)
  })
  const years = [...byYear.keys()].sort((a, b) => b - a)

  const content = `<div class="container">
  <div class="page-box">
    <div class="page-head">
      <p class="eyebrow">$ ls -R ./posts</p>
      <h1>归档<span class="accent">.</span></h1>
      <p>${posts.length} entries · 按时间排序</p>
    </div>
    ${years.map((y) => `<section class="archive-year">
      <div class="archive-year-head">
        <span class="year"><a href="/archives/${y}/">${y}</a></span>
        <span class="count">${byYear.get(y).length} 篇</span>
        <span class="line"></span>
      </div>
      <ul class="archive-list">
        ${byYear.get(y).map((p) => `<li class="archive-item">
          <a href="${link(p.url)}">
            <span class="date">${pad(p.date.getMonth() + 1)}-${pad(p.date.getDate())}</span>
            <span class="name">${escapeHtml(p.title)}</span>
          </a>
        </li>`).join('\n')}
      </ul>
    </section>`).join('\n')}
  </div>
</div>`

  write('archives/index.html', renderShell({ title: '归档', url: '/archives/', content }))

  /* 年 / 月归档子页，沿用旧站的 URL 规则：/archives/2025/、/archives/2025/08/ */
  const listHtml = (list) => `<ul class="archive-list">
        ${list.map((p) => `<li class="archive-item">
          <a href="${link(p.url)}">
            <span class="date">${pad(p.date.getMonth() + 1)}-${pad(p.date.getDate())}</span>
            <span class="name">${escapeHtml(p.title)}</span>
          </a>
        </li>`).join('\n')}
      </ul>`

  for (const y of years) {
    const yPosts = byYear.get(y)
    const byMonth = new Map()
    yPosts.forEach((p) => {
      const m = p.date.getMonth() + 1
      if (!byMonth.has(m)) byMonth.set(m, [])
      byMonth.get(m).push(p)
    })
    const months = [...byMonth.keys()].sort((a, b) => b - a)

    write(`archives/${y}/index.html`, renderShell({
      title: `${y} 年归档`,
      url: `/archives/${y}/`,
      description: `${y} 年的全部文章`,
      content: `<div class="container">
  <div class="page-box">
    <div class="page-head">
      <h1>${y} 年归档</h1>
      <p>共 ${yPosts.length} 篇 · <a href="/archives/">查看全部归档</a></p>
    </div>
    ${months.map((m) => `<section class="archive-year">
      <div class="archive-year-head">
        <span class="year"><a href="/archives/${y}/${pad(m)}/">${y} 年 ${pad(m)} 月</a></span>
        <span class="count">${byMonth.get(m).length} 篇</span>
        <span class="line"></span>
      </div>
      ${listHtml(byMonth.get(m))}
    </section>`).join('\n')}
  </div>
</div>`,
    }))

    for (const m of months) {
      write(`archives/${y}/${pad(m)}/index.html`, renderShell({
        title: `${y} 年 ${pad(m)} 月归档`,
        url: `/archives/${y}/${pad(m)}/`,
        description: `${y} 年 ${pad(m)} 月的全部文章`,
        content: `<div class="container">
  <div class="page-box">
    <div class="page-head">
      <h1>${y} 年 ${pad(m)} 月</h1>
      <p>共 ${byMonth.get(m).length} 篇 · <a href="/archives/${y}/">${y} 年归档</a> · <a href="/archives/">全部归档</a></p>
    </div>
    ${listHtml(byMonth.get(m))}
  </div>
</div>`,
      }))
    }
  }
}

/** 旧地址跳转页：把 site.config.mjs 里 legacyRedirects 的每一项生成一个跳转页 */
function buildLegacyRedirects() {
  const map = config.legacyRedirects || {}
  let n = 0
  for (const [from, to] of Object.entries(map)) {
    const clean = String(from).replace(/^\/+|\/+$/g, '')
    if (!clean) continue
    const target = link(to)
    const abs = config.siteUrl.replace(/\/$/, '') + target
    write(`${clean}/index.html`, `<!DOCTYPE html>
<html lang="${config.lang || 'zh-CN'}">
<head>
<meta charset="utf-8">
<title>页面已移动</title>
<link rel="canonical" href="${escapeHtml(abs)}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}">
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body>
<p>这个地址已经变了，正在前往 <a href="${escapeHtml(target)}">${escapeHtml(target)}</a>…</p>
</body>
</html>`)
    n += 1
  }
  return n
}

function buildTermPage(kind, posts, terms) {
  const singular = kind === 'tags' ? '标签' : '分类'
  const max = Math.max(1, ...terms.map((t) => t.count))

  const cloud = terms.map((t) => `<a class="term-item${t.count >= max * 0.6 ? ' hot' : ''}" href="${link(termUrl(kind, t.name))}">
    <span>${escapeHtml(t.name)}</span><span class="num">${t.count}</span>
  </a>`).join('\n')

  write(`${kind}/index.html`, renderShell({
    title: singular,
    url: `/${kind}/`,
    content: `<div class="container">
  <div class="page-box">
    <div class="page-head">
      <h1>${singular}</h1>
      <p>共 ${terms.length} 个${singular}，${posts.length} 篇文章</p>
    </div>
    <div class="term-cloud">${cloud}</div>
  </div>
</div>`,
  }))

  terms.forEach((t) => {
    const list = t.posts
    write(`${kind}/${termSlug(t.name)}/index.html`, renderShell({
      title: `${singular}：${t.name}`,
      url: termUrl(kind, t.name),
      content: `<div class="container">
  <div class="page-box">
    <div class="page-head">
      <h1>${icon(singular === '标签' ? 'tag' : 'folder')} ${escapeHtml(t.name)}</h1>
      <p>共 ${list.length} 篇文章</p>
    </div>
    <div class="post-list">${list.map(postCard).join('\n')}</div>
  </div>
</div>`,
    }))
  })
}

function collectTerms(posts, key) {
  const map = new Map()
  posts.forEach((p) => {
    p[key].forEach((name) => {
      if (!map.has(name)) map.set(name, [])
      map.get(name).push(p)
    })
  })
  return [...map.entries()]
    .map(([name, list]) => ({ name, count: list.length, posts: list }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'))
}

function buildStaticPages(pages) {
  const SKIP = new Set(['archives', 'sitemap'])
  pages.forEach((page) => {
    if (SKIP.has(page.slug)) return
    const toc = config.features.toc ? renderToc(page.headings) : ''
    const hasToc = toc !== '' && page.headings.filter((h) => h.level >= 2 && h.level <= 4).length >= 3

    const body = `<div class="page-box">
  <div class="page-head">
    <h1>${escapeHtml(page.title)}</h1>
    ${page.description ? `<p>${escapeHtml(page.description)}</p>` : ''}
  </div>
  <div class="article-body">
    ${page.html}
  </div>
  ${page.comments ? giscusBlock() : ''}
</div>`

    const content = hasToc
      ? `<div class="container"><div class="post-layout">${body}${toc}</div></div>`
      : `<div class="container">${body}</div>`

    write(`${page.slug}/index.html`, renderShell({
      title: page.title,
      description: page.description,
      url: page.url,
      content,
    }))
  })
}

function buildHelp() {
  write('help/index.html', renderShell({
    title: 'help', url: '/help/',
    content: `<div class="container page-box"><div class="page-head"><h1>help<span class="accent">.</span></h1><p>在命令框输入，或点击链接。</p></div>
    <div class="help-list">
      <a href="/">ls / posts <span>最新文章</span></a>
      <a href="/archives/">archive <span>全部归档</span></a>
      <a href="/tags/">tags <span>标签</span></a>
      <a href="/categories/">categories <span>分类</span></a>
      <a href="/about/">whoami / about <span>关于</span></a>
      <a href="/links/">links <span>友链</span></a>
      <a href="/atom.xml">rss <span>订阅</span></a>
      <a href="${config.github}">github <span>代码</span></a>
      <a href="mailto:${config.email}">email <span>联系</span></a>
      <p>search &lt;关键词&gt; <span>搜索全文</span></p>
      <p>open &lt;标题&gt; <span>打开文章</span></p>
      <p>theme [dark|light|auto] <span>切换主题</span></p>
      <p>clear <span>清空输出</span></p>
    </div><p class="shortcut-note">/ 或 ⌘/Ctrl K 聚焦 · ↑ ↓ 历史 · Tab 补全 · Esc 清空</p></div>`,
  }))
}

function build404() {
  write('404.html', renderShell({
    title: '页面不存在',
    url: '/404.html',
    content: `<div class="container">
  <div class="err-wrap">
    <div class="err-code">404</div>
    <h1>command not found</h1>
    <p>页面不存在。输入 help 查看入口。</p>
    <p>
      <a class="btn" href="/">${icon('home')} 回到首页</a>
      <a class="btn ghost" href="/archives/">${icon('archive')} 看看归档</a>
    </p>
  </div>
</div>`,
  }))
}

/* ================================================================== */
/* 订阅与索引                                                          */
/* ================================================================== */

function buildFeed(posts) {
  const items = posts.slice(0, 20).map((p) => `<entry>
  <title type="html">${escapeHtml(p.title)}</title>
  <link href="${absUrl(p.url)}"/>
  <id>${absUrl(p.url)}</id>
  <updated>${fmtDate(p.updated, 'iso')}</updated>
  <published>${fmtDate(p.date, 'iso')}</published>
  ${p.categories.map((c) => `<category term="${escapeHtml(c)}"/>`).join('')}
  <summary type="html">${escapeHtml(p.excerpt)}</summary>
</entry>`).join('\n')

  write('atom.xml', `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeHtml(config.title)}</title>
  <subtitle>${escapeHtml(config.subtitle)}</subtitle>
  <link href="${absUrl('/atom.xml')}" rel="self"/>
  <link href="${absUrl('/')}"/>
  <id>${absUrl('/')}</id>
  <updated>${fmtDate(posts.length ? new Date(Math.max(...posts.map((p) => p.updated.getTime()))) : new Date(), 'iso')}</updated>
  <author><name>${escapeHtml(config.author)}</name></author>
${items}
</feed>
`)
  write('feed.xml', fs.readFileSync(path.join(OUT, 'atom.xml')))
}

function buildSitemap(posts, pages) {
  const entries = [
    { url: '/', date: posts[0] ? posts[0].updated : new Date(), priority: '1.0' },
    { url: '/archives/', date: new Date(), priority: '0.7' },
    { url: '/categories/', date: new Date(), priority: '0.6' },
    { url: '/tags/', date: new Date(), priority: '0.6' },
    ...posts.map((p) => ({ url: p.url, date: p.updated, priority: '0.9' })),
    { url: '/help/', date: new Date(), priority: '0.5' },
    ...pages.filter((p) => !['archives', 'sitemap'].includes(p.slug)).map((p) => ({ url: p.url, date: p.date, priority: '0.5' })),
  ]

  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${absUrl(e.url)}</loc>
    <lastmod>${fmtDate(e.date)}</lastmod>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`)

  write('robots.txt', `User-agent: *
Allow: /
Disallow: /search.json

Sitemap: ${absUrl('/sitemap.xml')}
`)
}

function buildSearchIndex(posts, pages) {
  const data = [
    ...posts.map((p) => ({
      title: p.title,
      url: link(p.url),
      date: fmtDate(p.date),
      excerpt: p.excerpt,
      tags: p.tags,
      content: p.plain,
    })),
    ...pages.filter((p) => !['archives', 'sitemap'].includes(p.slug)).map((p) => ({
      title: p.title,
      url: link(p.url),
      date: fmtDate(p.date),
      excerpt: p.description || '',
      tags: [],
      content: extractText(p.html.replace(/<[^>]*>/g, ' '), 1500),
    })),
  ]
  write('search.json', JSON.stringify(data))
}

/* ================================================================== */
/* 静态资源                                                            */
/* ================================================================== */

function copyAssets() {
  copyDir(path.join(ROOT, 'assets', 'css'), path.join(OUT, 'css'))
  copyDir(path.join(ROOT, 'assets', 'js'), path.join(OUT, 'js'))
  copyDir(path.join(ROOT, 'assets', 'img'), path.join(OUT, 'img'))
  copyDir(path.join(ROOT, 'assets', 'photos'), path.join(OUT, 'photos'))
  // Retain media referenced by existing posts, without the gallery page.
  copyDir(path.join(ROOT, 'assets', 'photos-gallery'), path.join(OUT, 'photos-gallery'))
  copyDir(path.join(ROOT, 'static'), OUT)

  // 去掉从 Hexo 遗留的域名相关脚本
  const stale = ['js/redirect-handler.js']
  stale.forEach((f) => {
    const p = path.join(OUT, f)
    if (fs.existsSync(p)) fs.unlinkSync(p)
  })
}

/* ================================================================== */
/* 主流程                                                              */
/* ================================================================== */

/** 递归删除目录（用 unlink+rmdir，避免系统回收站带来的不确定性） */
function removeDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) removeDir(p)
    else { try { fs.unlinkSync(p) } catch (e) { /* ignore */ } }
  }
  try { fs.rmdirSync(dir) } catch (e) { /* ignore */ }
}

function clean() {
  if (path.dirname(OUT) !== ROOT || path.basename(OUT) !== `.blog-build-${process.pid}`) {
    throw new Error('拒绝清理未知目录：' + OUT)
  }
  removeDir(OUT)
}

function main() {
  const t0 = Date.now()
  clean()
  fs.mkdirSync(OUT, { recursive: true })

  const posts = loadPosts()
  const pages = loadPages()
  const tags = collectTerms(posts, 'tags')
  const categories = collectTerms(posts, 'categories')

  copyAssets()
  buildHome(posts)
  posts.forEach((p) => buildPost(p, posts))
  buildArchives(posts)
  buildLegacyRedirects()
  buildTermPage('tags', posts, tags)
  buildTermPage('categories', posts, categories)
  buildStaticPages(pages)
  buildHelp()
  build404()
  buildFeed(posts)
  buildSitemap(posts, pages)
  buildSearchIndex(posts, pages)

  const count = (dir) => {
    let n = 0
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '.DS_Store') continue
      if (e.isDirectory()) n += count(path.join(dir, e.name))
      else n += 1
    }
    return n
  }

  const fileCount = count(OUT)
  const backup = path.join(ROOT, `.blog-build-previous-${process.pid}`)
  // Keep the last successful site available until every output is ready.
  if (fs.existsSync(DEST)) fs.renameSync(DEST, backup)
  try {
    fs.renameSync(OUT, DEST)
  } catch (error) {
    if (fs.existsSync(backup)) fs.renameSync(backup, DEST)
    throw error
  }
  removeDir(backup)
  console.log(`built ${posts.length} posts · ${fileCount} files · ${Date.now() - t0}ms → public/`)
}

try { main() } finally { clean() }
