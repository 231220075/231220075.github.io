import { readDirectory, resolveFile, completePath, unquote } from './filesystem.mjs'

/* Summer Flower — read-only blog shell. */
(function () {
  'use strict'
  var SITE = window.__SITE__ || {}
  var FEATURES = SITE.features || {}

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    })
  }

  function applyTheme(mode, persist) {
    if (!['dark', 'light', 'auto'].includes(mode)) mode = 'dark'
    var actual = mode === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode
    document.documentElement.dataset.theme = actual
    var btn = document.querySelector('[data-theme-toggle]')
    if (btn) {
      btn.dataset.mode = mode
      btn.textContent = actual === 'dark' ? 'light' : 'dark'
      btn.setAttribute('aria-label', actual === 'dark' ? '切换亮色' : '切换暗色')
    }
    var meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.content = actual === 'dark' ? '#111413' : '#f5f6f0'
    if (persist) { try { localStorage.setItem('sf-theme', mode) } catch (e) {} }
    if (window.__syncGiscus) window.__syncGiscus()
    return mode
  }

  function initTheme() {
    var saved = 'dark'
    try { saved = localStorage.getItem('sf-theme') || 'dark' } catch (e) {}
    applyTheme(saved)
    var btn = document.querySelector('[data-theme-toggle]')
    if (btn) btn.addEventListener('click', function () {
      applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true)
    })
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (btn && btn.dataset.mode === 'auto') applyTheme('auto')
    })
    document.querySelectorAll('.nav-link').forEach(function (a) {
      var href = a.getAttribute('href')
      var active = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href)
      if (active) { a.classList.add('active'); a.setAttribute('aria-current', 'page') }
    })
  }

  function initTerminal() {
    var form = document.querySelector('.command-form')
    if (!form) return
    var terminal = form.closest('.terminal')
    var input = form.querySelector('input')
    var output = terminal.querySelector('.command-output')
    var directories = SITE.directories || []
    var cwd = terminal.dataset.cwd || '/'
    var history = [], cursor = 0, pending = '', revision = 0, indexPromise
    var routes = {
      home: '/', archive: '/archives/', archives: '/archives/', tags: '/tags/',
      categories: '/categories/', whoami: '/about/', about: '/about/', proj: '/proj/',
      links: '/links/', github: SITE.github, email: 'mailto:' + SITE.email
    }
    var commands = [
      ['ls [目录]', '分类 / 文章'], ['cd <目录>', '进入；.. 返回'], ['pwd', '当前目录'],
      ['open <文件 / 标题>', '文章'], ['proj', '项目'], ['search <关键词>', '搜索全文'],
      ['archive', '归档'], ['tags', '标签'], ['categories', '分类'], ['whoami', '关于'],
      ['links', '友链'], ['github', '代码'], ['email', '联系'],
      ['theme [dark|light|auto]', '主题'], ['clear', '清空'], ['help', '帮助']
    ]
    var names = commands.map(function (c) { return c[0].split(' ')[0] }).concat(['posts', 'home', 'about', 'archives', 'cat', 'grep'])
    function hasRoute(name) { return Object.prototype.hasOwnProperty.call(routes, name) }
    function quote(value) { return JSON.stringify(value) }
    function show(html, command) {
      output.hidden = false
      output.innerHTML = (command ? '<p class="command-echo">$ ' + escapeHtml(command) + '</p>' : '') + html
    }
    function clear() { revision++; output.hidden = true; output.replaceChildren() }
    function setDirectory(pathname) {
      cwd = pathname
      terminal.querySelector('[data-prompt-path]').textContent = cwd === '/' ? '~' : '~' + cwd
      terminal.querySelector('[data-current-path]').textContent = cwd === '/' ? '~/' : '~' + cwd + '/'
    }
    function list(target, command, changeDirectory) {
      try {
        var result = readDirectory(directories, cwd, target)
        if (changeDirectory) setDirectory(result.path)
        var parent = result.path === '/' ? '' : '<a class="file-entry parent-entry" href="/categories/" data-command="cd /"><span class="pixel-folder" aria-hidden="true"></span><span>../</span></a>'
        show('<div class="file-list' + (result.path === '/' ? ' directory-list' : '') + '">' + parent + result.entries.map(function (entry) {
          if (entry.type === 'directory') {
            return '<a class="file-entry directory-entry" href="' + escapeHtml(entry.url) + '" data-command="' + escapeHtml('cd ' + quote('/' + entry.name)) + '"><span class="pixel-folder" aria-hidden="true"></span><span>' + escapeHtml(entry.name) + '/</span><span class="entry-meta">' + entry.files.length + '</span></a>'
          }
          return '<a class="file-entry post-entry" href="' + escapeHtml(entry.url) + '" title="' + escapeHtml(entry.title) + '"><span class="pixel-file" aria-hidden="true"></span><span>' + escapeHtml(entry.name) + '</span><time class="entry-meta">' + escapeHtml(entry.date) + '</time></a>'
        }).join('') + (result.entries.length ? '' : '<p>空目录。</p>') + '</div>', command)
      } catch (e) { show('<p>' + escapeHtml(e.message) + '</p>', command) }
    }
    function help() {
      show('<div class="help-list">' + commands.map(function (c) {
        var name = c[0].split(' ')[0]
        if (hasRoute(name)) return '<a href="' + escapeHtml(routes[name]) + '">' + escapeHtml(c[0]) + '<span>' + c[1] + '</span></a>'
        return '<button type="button" class="help-command" data-command="' + escapeHtml(c[0]) + '">' + escapeHtml(c[0]) + '<span>' + c[1] + '</span></button>'
      }).join('') + '</div><p class="shortcut-note">/ · ⌘/Ctrl K 聚焦 · ↑ ↓ 历史 · Tab 补全 · Esc 清空</p>', 'help')
    }
    function loadIndex() {
      if (!indexPromise) indexPromise = fetch(SITE.searchPath || '/search.json').then(function (r) {
        if (!r.ok) throw new Error('index')
        return r.json()
      }).catch(function (err) { indexPromise = null; throw err })
      return indexPromise
    }
    function highlight(text, query) {
      var terms = query.toLowerCase().split(/\s+/).filter(Boolean)
      var pattern = terms.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }).join('|')
      return String(text).split(new RegExp('(' + pattern + ')', 'gi')).map(function (piece) {
        return terms.includes(piece.toLowerCase()) ? '<mark>' + escapeHtml(piece) + '</mark>' : escapeHtml(piece)
      }).join('')
    }
    async function find(query, open, command, token) {
      if (!query) { show('<p>' + (open ? 'open &lt;文件 / 标题&gt;' : 'search &lt;关键词&gt;') + '</p>', command); return }
      var file = open && resolveFile(directories, cwd, query)
      if (file) { location.assign(file.url); return }
      show('<p>搜索中…</p>', command)
      try {
        var index = await loadIndex()
        if (token !== revision) return
        var terms = query.toLowerCase().split(/\s+/).filter(Boolean)
        var entries = index.map(function (item) {
          var title = item.title.toLowerCase()
          var haystack = [item.title, item.content, (item.tags || []).join(' ')].join(' ').toLowerCase()
          var score = title === query.toLowerCase() ? 100 : 0
          terms.forEach(function (term) { if (title.includes(term)) score += 12 })
          return { item: item, score: score, match: terms.every(function (term) { return (open ? title : haystack).includes(term) }) }
        }).filter(function (x) { return x.match }).sort(function (a, b) { return b.score - a.score })
        if (open && entries.length && (entries.length === 1 || entries[0].score >= 100)) {
          location.assign(entries[0].item.url); return
        }
        if (!entries.length) { show('<p>无结果。</p>', command); return }
        show(entries.slice(0, 20).map(function (x) {
          var item = x.item
          var excerpt = item.excerpt || item.content.slice(0, 100)
          return '<a class="search-result" href="' + escapeHtml(item.url) + '"><div class="r-title">' + highlight(item.title, query) + '</div><div class="r-excerpt">' + highlight(excerpt, query) + '</div></a>'
        }).join(''), command)
      } catch (e) { if (token === revision) show('<p>索引加载失败。</p>', command) }
    }
    function execute(raw) {
      var command = raw.trim()
      if (!command) return
      var token = ++revision
      history.push(command); cursor = history.length; pending = ''; input.value = ''
      var parts = command.match(/^(\S+)(?:\s+([\s\S]*))?$/)
      var name = parts[1].toLowerCase(), arg = unquote(parts[2] || '')
      if (name === 'clear') { clear(); return }
      if (name === 'help') { help(); return }
      if (name === 'ls') { list(arg, command, false); return }
      if (name === 'cd' || name === 'posts') { list(name === 'posts' ? '/' : arg || '/', command, true); return }
      if (name === 'pwd') { show('<p>' + escapeHtml(cwd) + '</p>', command); return }
      if (hasRoute(name)) { location.assign(routes[name]); return }
      if (name === 'search' || name === 'grep' || name === 'open' || name === 'cat') {
        find(arg, name === 'open' || name === 'cat', command, token); return
      }
      if (name === 'theme') {
        if (arg && !['dark', 'light', 'auto'].includes(arg)) { show('<p>theme [dark|light|auto]</p>', command); return }
        var mode = arg || (document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
        applyTheme(mode, true); show('<p>' + mode + '</p>', command); return
      }
      show('<p>未知命令。<button class="text-btn accent" data-command="help">help</button></p>', command)
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); execute(input.value) })
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-command]')
      if (!btn) return
      e.preventDefault()
      var command = btn.dataset.command
      form.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      if (command.includes('<') || command.includes('[')) {
        input.value = command.split(' ')[0] + ' '; input.focus()
      } else { execute(command); input.focus() }
    })
    input.addEventListener('keydown', function (e) {
      if (e.isComposing) return
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (cursor === history.length) pending = input.value
        cursor = Math.max(0, Math.min(history.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)))
        input.value = cursor === history.length ? pending : history[cursor]
        requestAnimationFrame(function () { input.setSelectionRange(input.value.length, input.value.length) })
      }
      if (e.key === 'Tab' && input.value) {
        var match = /^(ls|cd|open|cat)\s+([\s\S]*)$/.exec(input.value)
        var matches = match ? completePath(directories, cwd, match[2], match[1] === 'cd').map(function (path) { return match[1] + ' ' + quote(path) }) : names.filter(function (name) { return name.startsWith(input.value.toLowerCase()) }).map(function (name) { return name + ' ' })
        if (matches.length === 1) { e.preventDefault(); input.value = matches[0] }
      }
      if (e.key === 'Escape') { input.value = ''; clear(); input.blur() }
    })
    document.addEventListener('keydown', function (e) {
      var active = document.activeElement
      var typing = active && (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName))
      if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault(); input.focus(); form.scrollIntoView({ block: 'nearest' })
      }
    })
    try { setDirectory(readDirectory(directories, '/', cwd).path) } catch { setDirectory('/') }
  }

  /* ---------- 阅读进度 ---------- */
  function initProgress() {
    if (!FEATURES.readingProgress) return
    var bar = document.querySelector('.progress-bar')
    var article = document.querySelector('.article-body')
    if (!bar || !article) return
    function update() {
      var rect = article.getBoundingClientRect()
      var total = rect.height - window.innerHeight
      var done = Math.min(Math.max(-rect.top, 0), Math.max(total, 1))
      bar.style.width = (total <= 0 ? 100 : (done / total) * 100) + '%'
      var top = document.querySelector('.back-top')
      if (top) top.classList.toggle('show', window.scrollY > 420)
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
  }

  /* ---------- 回到顶部 ---------- */
  function initBackTop() {
    var btn = document.querySelector('.back-top')
    if (!btn) return
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
    window.addEventListener('scroll', function () {
      btn.classList.toggle('show', window.scrollY > 420)
    }, { passive: true })
  }

  /* ---------- 目录高亮 ---------- */
  function initToc() {
    var toc = document.querySelector('.toc')
    if (!toc) return
    var links = Array.prototype.slice.call(toc.querySelectorAll('a'))
    if (!links.length) return
    var targets = links.map(function (a) {
      return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)))
    })
    var current = -1
    function update() {
      var offset = window.innerHeight * 0.22
      var idx = 0
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].getBoundingClientRect().top <= offset) idx = i
      }
      if (idx !== current) {
        current = idx
        links.forEach(function (a, i) { a.classList.toggle('active', i === idx) })
      }
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
  }

  /* ---------- 代码块复制 ---------- */
  function initCopy() {
    if (!FEATURES.copyCode) return
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy]')
      if (!btn) return
      var block = btn.closest('.code-block')
      var code = block && block.querySelector('code')
      if (!code) return
      var text = code.innerText
      var done = function () {
        var old = btn.textContent
        btn.textContent = 'copied'
        btn.classList.add('done')
        setTimeout(function () { btn.textContent = old; btn.classList.remove('done') }, 1600)
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback)
      } else fallback()
      function fallback() {
        var ta = document.createElement('textarea')
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.select()
        try { document.execCommand('copy'); done() } catch (err) {}
        document.body.removeChild(ta)
      }
    })
  }

  /* ---------- 图片灯箱 ---------- */
  function initLightbox() {
    if (!FEATURES.lightbox) return
    var box = document.querySelector('.lightbox')
    if (!box) return
    var img = box.querySelector('img')
    var previousFocus
    function open(src, alt) {
      previousFocus = document.activeElement
      img.src = src
      img.alt = alt || ''
      box.classList.add('show')
      box.querySelector('button').focus()
      document.body.style.overflow = 'hidden'
    }
    function close() {
      var wasOpen = box.classList.contains('show')
      box.classList.remove('show')
      if (wasOpen && previousFocus) previousFocus.focus()
      document.body.style.overflow = ''
    }
    document.addEventListener('click', function (e) {
      var target = e.target
      if (target.classList && target.classList.contains('md-img')) {
        e.preventDefault()
        open(target.getAttribute('src'), target.getAttribute('alt'))
      }
    })
    box.addEventListener('keydown', function (e) { if (e.key === 'Tab') { e.preventDefault(); box.querySelector('button').focus() } })
    box.addEventListener('click', close)
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close() })
  }

  /* ---------- 评论（Giscus，按需注入并同步主题） ---------- */
  function initGiscus() {
    var host = document.querySelector('[data-giscus]')
    if (!host) return

    var themeOf = function () {
      return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    }

    var s = document.createElement('script')
    s.src = 'https://giscus.app/client.js'
    s.async = true
    s.crossOrigin = 'anonymous'
    var attrs = {
      'data-repo': host.getAttribute('data-repo'),
      'data-repo-id': host.getAttribute('data-repo-id'),
      'data-category': host.getAttribute('data-category'),
      'data-category-id': host.getAttribute('data-category-id'),
      'data-mapping': host.getAttribute('data-mapping') || 'pathname',
      'data-strict': '0',
      'data-reactions-enabled': '1',
      'data-emit-metadata': '0',
      'data-input-position': 'top',
      'data-theme': themeOf(),
      'data-lang': 'zh-CN',
      'data-loading': 'lazy',
    }
    var term = host.getAttribute('data-term')
    if (term) attrs['data-term'] = term
    Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]) })
    host.appendChild(s)

    var config = null
    window.addEventListener('message', function (event) {
      if (event.origin !== 'https://giscus.app') return
      if (!(event.data && event.data.giscus)) return
      if (!config) config = event.data.giscus
    })

    window.__syncGiscus = function () {
      var iframe = document.querySelector('iframe.giscus-frame')
      if (!iframe || !iframe.contentWindow) return
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: themeOf() } } },
        'https://giscus.app',
      )
    }
  }


  function boot() {
    initTheme(); initTerminal(); initProgress(); initBackTop(); initToc(); initCopy(); initLightbox(); initGiscus()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()
