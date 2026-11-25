/**
 * 站点生成器 —— 零依赖
 * 读取 content/ + assets/ + static/，输出完整静态站点到 public/
 *
 * 用法：node tools/build.mjs
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../site.config.mjs'
import { renderMarkdown, parseFrontMatter, extractText, escapeHtml } from './markdown.mjs'
import { installOutput } from './output.mjs'
import { quoteArgument, renderCommand, renderHelp, renderPathSuffix } from '../assets/js/terminal.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'summer-flower-build-'))

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

const S = (d) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`

const ICONS = {
  book: S('<path d="M4 5h16v15H4zM8 5v15"/>'),
  arrowUp: S('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  folder: S('<path d="M3 7h6l2 2h10v11H3z"/>'),
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
    github: config.github,
    email: config.email,
  }).replace(/</g, '\\u003c')};`
}

const flower = String.raw`    .-.   .-.
   (   \ /   )
 .--'   o   '--.
(     /   \     )
 \__.'     '.__/
    '.___.'
       |
    \__|__/`

function renderHomeOverview(posts) {
  const art = flower.split('\n').map(line => `<span>${escapeHtml(line)}</span>`).join('')
  return `<div class="home-overview">
    <pre class="home-flower" aria-hidden="true">${art}</pre>
    <dl class="profile-fields">
      <dt>User</dt><dd><a href="/about/">${escapeHtml(config.author)}</a> @ ${escapeHtml(config.affiliation)}</dd>
      <dt>Focus</dt><dd>${escapeHtml(config.focus)}</dd>
      <dt>Posts</dt><dd><a href="/archives/" data-command="ls -l ~/posts" aria-label="浏览 ${posts.length} 篇文章">${posts.length}</a></dd>
      <dt>Projects</dt><dd><a href="/proj/" aria-label="查看 ${config.projects.length} 个项目">${config.projects.length}</a></dd>
      <dt>GitHub</dt><dd><a href="${escapeHtml(config.github)}">${escapeHtml(config.github.replace(/^https?:\/\//, ''))}</a></dd>
    </dl>
  </div>`
}

function renderTerminal({ home, post, cwd, posts, content, initialCommand }) {
  const page = home ? '' : `<div class="terminal-page">${content}</div>`
  let initial = ''
  if (home) initial = `<h1 class="visually-hidden">${escapeHtml(config.title)}</h1>${renderHomeOverview(posts)}`
  else if (!post) initial = renderCommand(cwd, initialCommand, true) + page
  const homeLink = '<a href="/" aria-label="首页">~</a>'
  const path = renderPathSuffix(cwd)
  return `<section class="terminal" aria-label="博客终端" data-cwd="${escapeHtml(cwd)}">${post ? `\n  <noscript><div class="prompt-path">${homeLink}${path}</div></noscript>` : ''}
  <div data-startup${post ? ' hidden' : ''}>${initial}</div>
  <div class="command-output" role="log" aria-label="命令记录" aria-relevant="additions text"></div>
  <form class="command-form" autocomplete="off" hidden>
    <div class="prompt-path">${homeLink}<span data-prompt-path>${path}</span></div>
    <label class="command-line">
      <span class="prompt-glyph" aria-hidden="true">&gt;&gt;</span>
      <span class="command-field">
        <input class="command-input" name="command" placeholder=" " aria-label="命令" spellcheck="false" autocapitalize="off" autocorrect="off" enterkeyhint="go">
        <span class="prompt-cursor" aria-hidden="true"></span>
      </span>
    </label>
  </form>${post ? '\n  ' + page : ''}
</section>`
}

function renderShell({ title, description, url, content, bodyClass, extraHead, cwd = '/', posts = [], initialCommand = '' }) {
  const fullTitle = title ? `${escapeHtml(title)} | ${escapeHtml(config.title)}` : escapeHtml(config.title)
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
<meta name="theme-color" content="#141d19">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="${bodyClass === 'is-post' ? 'article' : 'website'}">
<meta property="og:title" content="${escapeHtml(title || config.title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="${escapeHtml(config.title)}">
<meta property="og:locale" content="zh_CN">
<meta name="twitter:card" content="summary">
<link rel="icon" href="${config.favicon}">
<link rel="stylesheet" href="/css/style.css">
<style>${accentCss}</style>
<script>${themeBoot}</script>
<script>${siteScript()}</script>
${extraHead || ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip-link" href="#main">跳到主要内容</a>
<div class="progress-bar"></div>
<main class="site-main" id="main">
${renderTerminal({ home: bodyClass === 'is-home', post: bodyClass === 'is-post', cwd, posts, content, initialCommand })}
</main>
${bodyClass === 'is-post' ? `<button class="back-top" type="button" aria-label="回到顶部">${icon('arrowUp')}</button>` : ''}
<div class="lightbox" role="dialog" aria-modal="true" aria-label="图片预览">
  <button class="lightbox-close" type="button" aria-label="关闭">✕</button>
  <img src="" alt="">
</div>
<script type="module" src="/js/main.js"></script>
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
        categories: [].concat(data.categories || []).filter(Boolean).length ? [].concat(data.categories).filter(Boolean) : ['未分类'],
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

function giscusBlock() {
  const g = config.giscus || {}
  if (!g.enable) return ''
  return `<section class="comments" id="comments">
  <h3>${icon('message')} 评论</h3>
  <div class="giscus-wrap" data-giscus
    data-repo="${g.repo}"
    data-repo-id="${g.repoId}"
    data-category="${g.category}"
    data-category-id="${g.categoryId}"
    data-mapping="${g.mapping}"></div>
</section>`
}

/* ================================================================== */
/* 页面生成                                                            */
/* ================================================================== */

function buildHome(posts) {
  write('index.html', renderShell({ title: '', bodyClass: 'is-home', url: '/', content: '', posts }))
}

function buildProjects() {
  const projects = config.projects.map(project => {
    const article = project.article ? `<a href="${link(project.article)}">项目文章</a>` : ''
    const repo = project.featured ? 'GitHub 源码' : project.url.replace('https://github.com/', '')
    const preview = project.preview ? `<a href="${escapeHtml(project.preview.url)}">${escapeHtml(project.preview.label)}</a>` : ''

    return `<article class="project">
      <h2>${escapeHtml(project.name)}</h2>
      <p>${escapeHtml(project.description)}</p>
      <div class="project-links">
        ${article}<a href="${escapeHtml(project.url)}" target="_blank" rel="noopener">${escapeHtml(repo)}</a>${preview}
      </div>
    </article>`
  }).join('\n')

  write('proj/index.html', renderShell({
    title: 'proj', url: '/proj/', initialCommand: 'cat projects.md',
    content: `<section class="projects"><h1 class="visually-hidden">项目</h1>${projects}</section>`,
  }))
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

  const toc = config.features.toc ? renderToc(post.headings) : ''

  const article = `<article class="article">
  <header class="article-header">
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
  <div class="post-layout${toc ? '' : ' no-toc'}">
    ${article}
    ${toc}
  </div>
  ${post.comments ? giscusBlock() : ''}
</div>`

  write(path.join(post.url.replace(/^\//, ''), 'index.html'), renderShell({
    title: post.title,
    description: post.excerpt,
    url: post.url,
    content,
    bodyClass: 'is-post',
    cwd: '/posts',
    extraHead: `<meta property="article:published_time" content="${fmtDate(post.date, 'iso')}">
<meta property="article:author" content="${escapeHtml(config.author)}">`,
  }))
}

function renderArchiveEntries(posts) {
  return `<ul class="archive-list">${posts.map(post => `<li class="archive-item">
    <time datetime="${fmtDate(post.date)}">${fmtDate(post.date)}</time>
    <a href="${link(post.url)}">${escapeHtml(post.title)}</a>
  </li>`).join('')}</ul>`
}

function buildArchives(posts) {
  const byYear = new Map()
  for (const post of posts) {
    const year = post.date.getFullYear()
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push(post)
  }
  const years = [...byYear.keys()].sort((a, b) => b - a)
  const section = (label, href, list) => `<section class="archive-group">
    <h2><a class="shell-directory" href="${href}">${label}/</a></h2>${renderArchiveEntries(list)}
  </section>`
  write('archives/index.html', renderShell({
    title: '归档', url: '/archives/', cwd: '/posts', initialCommand: 'ls -l',
    content: `<h1 class="visually-hidden">归档</h1>${years.map(year => section(year, `/archives/${year}/`, byYear.get(year))).join('')}`,
  }))

  for (const year of years) {
    const byMonth = new Map()
    for (const post of byYear.get(year)) {
      const month = pad(post.date.getMonth() + 1)
      if (!byMonth.has(month)) byMonth.set(month, [])
      byMonth.get(month).push(post)
    }
    const url = `/archives/${year}/`
    write(`archives/${year}/index.html`, renderShell({
      title: `${year} 年归档`, url, cwd: '/posts', initialCommand: 'archive',
      description: `${year} 年的全部文章`,
      content: `<h1 class="visually-hidden">${year} 年归档</h1><a class="shell-directory" href="/archives/">../</a>${[...byMonth].map(([month, list]) => section(month, url + month + '/', list)).join('')}`,
    }))
    for (const [month, list] of byMonth) {
      write(`archives/${year}/${month}/index.html`, renderShell({
        title: `${year} 年 ${month} 月归档`, url: url + month + '/', cwd: '/posts', initialCommand: 'archive',
        description: `${year} 年 ${month} 月的全部文章`,
        content: `<h1 class="visually-hidden">${year} 年 ${month} 月归档</h1><a class="shell-directory" href="${url}">../</a>${renderArchiveEntries(list)}`,
      }))
    }
  }
}

/** 旧地址跳转页：把 site.config.mjs 里 legacyRedirects 的每一项生成一个跳转页 */
function buildLegacyRedirects() {
  const map = config.legacyRedirects || {}
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
  }
}

function buildTermPage(kind, terms) {
  const singular = kind === 'tags' ? '标签' : '分类'
  const directories = terms.map(term => `<li><a class="shell-directory" href="${link(termUrl(kind, term.name))}">${escapeHtml(termSlug(term.name))}/</a></li>`).join('')
  write(`${kind}/index.html`, renderShell({
    title: singular, url: `/${kind}/`, cwd: `/${kind}`, initialCommand: 'ls',
    content: `<h1 class="visually-hidden">${singular}</h1><ul class="ls-list">${directories}</ul>`,
  }))

  for (const term of terms) {
    const name = termSlug(term.name)
    write(`${kind}/${name}/index.html`, renderShell({
      title: `${singular}：${term.name}`, url: termUrl(kind, term.name), cwd: `/${kind}/${name}`, initialCommand: 'ls -l',
      content: `<h1 class="visually-hidden">${escapeHtml(term.name)}</h1><a class="shell-directory" href="/${kind}/">../</a>${renderArchiveEntries(term.posts)}`,
    }))
  }
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
      initialCommand: 'cat ' + quoteArgument(`${page.slug}.md`),
      content,
    }))
  })
}

function buildHelp() {
  write('help/index.html', renderShell({
    title: 'help', url: '/help/', initialCommand: 'help',
    content: `<h1 class="visually-hidden">help</h1>${renderHelp(config)}`,
  }))
}

function build404() {
  write('404.html', renderShell({
    title: '页面不存在',
    url: '/404.html',
    initialCommand: 'open ' + quoteArgument('/404.html'),
    content: '<h1 class="error-line">404: 页面不存在</h1>',
  }))
}

/* ================================================================== */
/* 索引                                                          */
/* ================================================================== */


function buildSitemap(posts, pages) {
  const entries = [
    { url: '/', date: posts[0] ? posts[0].updated : new Date(), priority: '1.0' },
    { url: '/archives/', date: new Date(), priority: '0.7' },
    { url: '/categories/', date: new Date(), priority: '0.6' },
    { url: '/tags/', date: new Date(), priority: '0.6' },
    ...posts.map((p) => ({ url: p.url, date: p.updated, priority: '0.9' })),
    { url: '/help/', date: new Date(), priority: '0.5' },
    { url: '/proj/', date: new Date(), priority: '0.7' },
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

function buildFilesystem(posts, pages, termsByKind) {
  const directory = (name, url) => ({ type: 'directory', name, url })
  const file = (name, title, url) => ({ type: 'file', name, title, url })
  const files = new Map(posts.map(post => [post, {
    ...file(post.file, post.title, link(post.url)), date: fmtDate(post.date), tags: post.tags,
  }]))
  const directories = {
    '/': { url: '/', entries: [directory('posts', '/archives/'), directory('tags', '/tags/'), directory('categories', '/categories/'),
      ...pages.filter(page => !['archives', 'sitemap'].includes(page.slug)).map(page => file(`${page.slug}.md`, page.title, link(page.url))),
      file('projects.md', '项目', '/proj/'),
    ] },
    '/posts': { url: '/archives/', entries: [...files.values()] },
  }
  for (const [kind, terms] of Object.entries(termsByKind)) {
    const entries = terms.map(term => {
      const name = termSlug(term.name)
      const url = link(termUrl(kind, term.name))
      const pathname = `/${kind}/${name}`
      if (Object.hasOwn(directories, pathname)) throw new Error(`目录重名：${pathname}`)
      directories[pathname] = { url, entries: term.posts.map(post => files.get(post)) }
      return directory(name, url)
    })
    directories[`/${kind}`] = { url: `/${kind}/`, entries }
  }
  write('vfs.json', JSON.stringify(directories))
}

function buildSearchIndex(posts, pages) {
  const data = [
    ...posts.map((p) => ({
      title: p.title,
      path: `posts/${p.file}`,
      url: link(p.url),
      date: fmtDate(p.date),
      excerpt: p.excerpt,
      tags: p.tags,
      content: p.plain,
    })),
    ...pages.filter((p) => !['archives', 'sitemap'].includes(p.slug)).map((p) => ({
      title: p.title,
      path: `${p.slug}.md`,
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
  // 保留文章仍引用的旧相册资源地址。
  copyDir(path.join(ROOT, 'assets', 'photos-gallery'), path.join(OUT, 'photos-gallery'))
  copyDir(path.join(ROOT, 'static'), OUT)
}

/* ================================================================== */
/* 主流程                                                              */
/* ================================================================== */

function main() {
  const t0 = Date.now()

  const posts = loadPosts()
  const pages = loadPages()
  const tags = collectTerms(posts, 'tags')
  const categories = collectTerms(posts, 'categories')
  buildFilesystem(posts, pages, { categories, tags })

  copyAssets()
  buildHome(posts)
  buildProjects()
  posts.forEach((p) => buildPost(p, posts))
  buildArchives(posts)
  buildLegacyRedirects()
  buildTermPage('tags', tags)
  buildTermPage('categories', categories)
  buildStaticPages(pages)
  buildHelp()
  build404()
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
  installOutput(ROOT, OUT)
  console.log(`built ${posts.length} posts · ${fileCount} files · ${Date.now() - t0}ms → public/`)
}

try { main() } finally { fs.rmSync(OUT, { recursive: true, force: true }) }
