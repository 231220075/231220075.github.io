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
const OUT = path.join(ROOT, 'public')

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

function encodePath(p) {
  return p.split('/').map((seg) => encodeURIComponent(seg)).join('/')
}

/** 生成可安全放进 href 的地址（中文/空格/特殊字符会被编码） */
function link(u) {
  return String(u).split('/').map((seg) => encodeURIComponent(seg)).join('/')
}

/** 标签 / 分类的目录名（去掉路径分隔符，避免生成嵌套目录） */
function termSlug(name) {
  return String(name).replace(/[/\\:*?"<>|]/g, '-').trim() || 'unknown'
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
    else fs.copyFileSync(s, d)
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
  home: S('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
  compass: S('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>'),
  music: S('<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>'),
  film: S('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h18M3 15h18"/>'),
  camera: S('<path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.4"/>'),
  gamepad: S('<rect x="2.5" y="7" width="19" height="10" rx="4"/><path d="M7.5 10.5v3M6 12h3M15.5 11.5h.01M17.5 13.5h.01"/>'),
  robot: S('<rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16h5"/>'),
  archive: S('<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8"/><path d="M10 12h4"/>'),
  folder: S('<path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
  tag: S('<path d="M20.6 13.4 12 22l-9-9 8.6-8.6a2 2 0 0 1 1.4-.6H19a2 2 0 0 1 2 2v7.2a2 2 0 0 1-.4 1.4z"/><circle cx="16.5" cy="7.5" r="1.2"/>'),
  link: S('<path d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1 1"/><path d="M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1-1"/>'),
  message: S('<path d="M20 15a3 3 0 0 1-3 3H8l-5 3V6a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3z"/><path d="M8 9h8M8 13h5"/>'),
  user: S('<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
  search: S('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>'),
  sun: S('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>'),
  moon: S('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'),
  monitor: S('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>'),
  arrowUp: S('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  calendar: S('<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
  clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'),
  book: S('<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>'),
  github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.12 2.91.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.03 10.03 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>',
  mail: S('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
  rss: S('<path d="M5 19h.01"/><path d="M5 12a7 7 0 0 1 7 7"/><path d="M5 5a14 14 0 0 1 14 14"/>'),
  x: S('<path d="M18 6 6 18M6 6l12 12"/>'),
  menu: S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  arrowRight: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  chevronDown: S('<path d="m6 9 6 6 6-6"/>'),
  list: S('<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>'),
  eye: S('<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  sparkles: S('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.4 6.4l2.8 2.8M14.8 14.8l2.8 2.8M17.6 6.4l-2.8 2.8M9.2 14.8l-2.8 2.8"/>'),
  heart: S('<path d="M12 20s-7-4.5-7-9.5A3.9 3.9 0 0 1 12 7.6 3.9 3.9 0 0 1 19 10.5c0 5-7 9.5-7 9.5z"/>'),
  globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>'),
}

const icon = (name) => ICONS[name] || ICONS.book

/* ================================================================== */
/* 布局                                                                */
/* ================================================================== */

const accentCss = `:root{--accent:${config.accent};}`

const themeBoot = `(function(){try{var m=localStorage.getItem('sf-theme')||'auto';var d=m==='dark'||(m==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`

function siteScript() {
  return `window.__SITE__=${JSON.stringify({
    features: config.features,
    searchPath: '/search.json',
  })};`
}

function renderNav(current) {
  const items = config.nav.map((item) => {
    if (item.children && item.children.length) {
      const sub = item.children.map((c) =>
        `<a href="${c.url}">${icon(c.icon)}<span>${escapeHtml(c.name)}</span></a>`).join('')
      return `<div class="nav-item">
  <a class="nav-link" href="${item.children[0].url}">${icon(item.icon)}<span>${escapeHtml(item.name)}</span>${icon('chevronDown')}</a>
  <div class="nav-dropdown">${sub}</div>
</div>`
    }
    return `<div class="nav-item">
  <a class="nav-link" href="${item.url}">${icon(item.icon)}<span>${escapeHtml(item.name)}</span></a>
</div>`
  }).join('\n')

  return `<nav class="nav" id="site-nav">
${items}
</nav>`
}

function renderHeader() {
  return `<header class="site-header">
  <div class="header-inner">
    <a class="brand" href="/">
      <img src="${config.avatar}" alt="${escapeHtml(config.author)}">
      <span class="brand-name">${escapeHtml(config.title)}</span>
    </a>
    ${renderNav()}
    <div class="header-actions">
      ${config.features.search ? `<button class="icon-btn" type="button" data-search-open aria-label="搜索">${icon('search')}</button>` : ''}
      ${config.features.darkMode ? `<button class="icon-btn" type="button" data-theme-toggle aria-label="切换主题">
        <span class="ico-auto">${icon('monitor')}</span>
        <span class="ico-sun" style="display:none">${icon('sun')}</span>
        <span class="ico-moon" style="display:none">${icon('moon')}</span>
      </button>` : ''}
      <button class="icon-btn menu-toggle" type="button" data-menu-toggle aria-label="菜单" aria-expanded="false">${icon('menu')}</button>
    </div>
  </div>
</header>`
}

function renderFooter() {
  const year = new Date().getFullYear()
  const since = config.footer.since
  const range = year > since ? `${since}–${year}` : String(year)
  return `<footer class="site-footer">
  <div class="footer-inner">
    <div>© ${range} ${escapeHtml(config.author)} · Powered by 自建静态站点</div>
    <div class="footer-links">
      <a href="/archives/">归档</a>
      <a href="/tags/">标签</a>
      <a href="/categories/">分类</a>
      <a href="/sitemap/">网站地图</a>
      <a href="/atom.xml">RSS</a>
      <a href="${config.github}" target="_blank" rel="noopener">GitHub</a>
      <a href="mailto:${config.email}">Email</a>
    </div>
    ${config.footer.icp ? `<div>${escapeHtml(config.footer.icp)}</div>` : ''}
  </div>
</footer>`
}

function renderShell({ title, description, url, content, bodyClass, extraHead }) {
  const fullTitle = title ? `${escapeHtml(title)} | ${escapeHtml(config.title)}` : `${escapeHtml(config.title)} - ${escapeHtml(config.subtitle)}`
  const desc = description || config.description
  const canonical = absUrl(url)

  return `<!DOCTYPE html>
<html lang="${config.lang}" data-theme="light">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${fullTitle}</title>
<meta name="description" content="${escapeHtml(desc)}">
<meta name="author" content="${escapeHtml(config.author)}">
<meta name="keywords" content="${escapeHtml((config.keywords || []).join(','))}">
<meta name="theme-color" content="#ffffff">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title || config.title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${escapeHtml(config.title)}">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${config.favicon}">
<link rel="apple-touch-icon" href="${config.avatar}">
<link rel="manifest" href="/manifest.json">
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
${content}
</main>
${renderFooter()}
<button class="back-top" type="button" aria-label="回到顶部">${icon('arrowUp')}</button>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="图片预览">
  <button class="lightbox-close" type="button" aria-label="关闭">✕</button>
  <img src="" alt="">
</div>
${config.features.search ? `<div class="search-mask">
  <div class="search-panel">
    <div class="search-input-wrap">
      ${icon('search')}
      <input class="search-input" type="search" placeholder="搜索文章…" aria-label="搜索">
      <span class="search-kbd">Esc</span>
    </div>
    <div class="search-results"></div>
  </div>
</div>` : ''}
<script src="/js/main.js" defer></script>
<script src="/js/pwa-install.js" defer></script>
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
  const cover = post.cover
    ? `<div class="post-card-cover"><img src="${post.cover}" alt="${escapeHtml(post.title)}" loading="lazy"></div>`
    : ''
  const tags = post.tags.slice(0, 3).map((t) =>
    `<a class="tag-chip" href="${link(termUrl('tags', t))}">${escapeHtml(t)}</a>`).join('')

  return `<article class="post-card">
  <div class="post-card-body">
    <h3 class="post-card-title"><a href="${link(post.url)}">${escapeHtml(post.title)}</a></h3>
    <p class="post-card-excerpt">${escapeHtml(post.excerpt)}</p>
    <div class="post-card-meta">
      <span class="meta-item">${icon('calendar')}${fmtDate(post.date)}</span>
      <span class="meta-item">${icon('clock')}${post.minutes} 分钟</span>
      ${tags ? `<span class="tag-chips">${tags}</span>` : ''}
    </div>
  </div>
  ${cover}
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
  <p class="toc-title">目录</p>
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
    <img class="hero-avatar" src="${config.avatar}" alt="${escapeHtml(config.author)}">
    <div class="hero-text">
      <h1 class="hero-title">${escapeHtml(config.title)}</h1>
      <p class="hero-sub">${escapeHtml(config.subtitle)}</p>
      <div class="hero-meta">
        <a href="${config.github}" target="_blank" rel="noopener">${icon('github')} GitHub</a>
        <a href="mailto:${config.email}">${icon('mail')} 邮箱</a>
        <a href="/atom.xml">${icon('rss')} RSS</a>
        <span>${icon('book')} ${posts.length} 篇文章</span>
      </div>
    </div>
  </section>` : ''

    const content = `<div class="container">
  ${hero}
  <div class="section-head">
    <h2>${page === 1 ? '最新文章' : `第 ${page} 页`}</h2>
    <span class="count">共 ${posts.length} 篇</span>
    <span class="line"></span>
  </div>
  <div class="post-list">
    ${slice.map(postCard).join('\n')}
  </div>
  ${pagination(page, totalPages, '/')}
</div>`

    const file = page === 1 ? 'index.html' : `page/${page}/index.html`
    const url = page === 1 ? '/' : `/page/${page}/`
    write(file, renderShell({
      title: page === 1 ? '' : `第 ${page} 页`,
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
    <h1 class="article-title">${escapeHtml(post.title)}</h1>
    <div class="article-meta">
      <span class="meta-item">${icon('calendar')}${fmtDate(post.date)}</span>
      ${fmtDate(post.updated) !== fmtDate(post.date) ? `<span class="meta-item">${icon('clock')}更新于 ${fmtDate(post.updated)}</span>` : ''}
      <span class="meta-item">${icon('book')}${post.minutes} 分钟阅读</span>
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

  const tagCount = new Set(posts.flatMap((p) => p.tags)).size
  const catCount = new Set(posts.flatMap((p) => p.categories)).size
  const totalMinutes = posts.reduce((s, p) => s + p.minutes, 0)

  const content = `<div class="container">
  <div class="page-box">
    <div class="page-head">
      <h1>归档</h1>
      <p>按时间倒序浏览全部文章</p>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="num">${posts.length}</div><div class="label">篇文章</div></div>
      <div class="stat-card"><div class="num">${catCount}</div><div class="label">个分类</div></div>
      <div class="stat-card"><div class="num">${tagCount}</div><div class="label">个标签</div></div>
      <div class="stat-card"><div class="num">${totalMinutes}</div><div class="label">分钟阅读量</div></div>
    </div>
    ${years.map((y) => `<section class="archive-year">
      <div class="archive-year-head">
        <span class="year">${y}</span>
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
  const SKIP = new Set(['archives'])
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

/** 留言板（全站留言集中在一个 Discussion 里） */
function buildComments() {
  const g = config.giscus || {}
  if (!g.enable) return
  write('comments/index.html', renderShell({
    title: '留言板',
    url: '/comments/',
    description: '欢迎在这里留言',
    content: `<div class="container">
  <div class="page-box">
    <div class="page-head">
      <h1>留言板</h1>
      <p>用 GitHub 账号登录后即可留言</p>
    </div>
    <section class="comments" style="margin-top:0;border:0;padding:0">
      <div class="giscus-wrap" data-giscus
        data-repo="${g.repo}"
        data-repo-id="${g.repoId}"
        data-category="${g.category}"
        data-category-id="${g.categoryId}"
        data-mapping="specific"
        data-term="留言板"></div>
    </section>
  </div>
</div>`,
  }))
}

function build404() {
  write('404.html', renderShell({
    title: '页面不存在',
    url: '/404.html',
    content: `<div class="container">
  <div class="err-wrap">
    <div class="err-code">404</div>
    <h1>这个页面好像走丢了</h1>
    <p>你访问的地址不存在，或者已经被移动过。</p>
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
  <updated>${fmtDate(posts[0] ? posts[0].updated : new Date(), 'iso')}</updated>
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
    ...pages.map((p) => ({ url: p.url, date: p.date, priority: '0.5' })),
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
      content: p.plain.slice(0, 3000),
    })),
    ...pages.map((p) => ({
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
  if (path.basename(OUT) !== 'public' || !OUT.startsWith(ROOT)) {
    throw new Error('拒绝清理非 public 目录：' + OUT)
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
  buildTermPage('tags', posts, tags)
  buildTermPage('categories', posts, categories)
  buildStaticPages(pages)
  buildComments()
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

  console.log(`✅ 构建完成 ${Date.now() - t0}ms`)
  console.log(`   文章 ${posts.length} 篇 · 页面 ${pages.length} 个 · 标签 ${tags.length} 个 · 分类 ${categories.length} 个`)
  console.log(`   产物 ${count(OUT)} 个文件 → public/`)
}

main()
