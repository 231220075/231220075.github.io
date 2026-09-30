/* ==========================================================================
   Summer Flower —— 前端交互（无任何第三方依赖）
   ========================================================================== */
(function () {
  'use strict'

  var SITE = window.__SITE__ || {}
  var FEATURES = SITE.features || {}

  /* ---------- 主题切换 ---------- */
  function initTheme() {
    var KEY = 'sf-theme'
    var root = document.documentElement
    var btn = document.querySelector('[data-theme-toggle]')
    if (!btn) return

    var ICONS = { auto: '.ico-auto', light: '.ico-sun', dark: '.ico-moon' }
    var LABELS = { auto: '跟随系统', light: '亮色模式', dark: '暗色模式' }

    function apply(mode) {
      if (!ICONS[mode]) mode = 'auto'
      var theme = mode === 'auto'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : mode

      root.setAttribute('data-theme', theme)
      var meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#0e1015' : '#ffffff')

      btn.setAttribute('data-mode', mode)
      btn.setAttribute('aria-label', LABELS[mode])
      btn.setAttribute('title', LABELS[mode])

      Object.keys(ICONS).forEach(function (key) {
        var el = btn.querySelector(ICONS[key])
        if (el) el.style.display = key === mode ? '' : 'none'
      })
    }

    var saved = 'auto'
    try { saved = localStorage.getItem(KEY) || 'auto' } catch (e) {}
    apply(saved)

    btn.addEventListener('click', function () {
      var order = ['auto', 'light', 'dark']
      var cur = btn.getAttribute('data-mode') || 'auto'
      var next = order[(order.indexOf(cur) + 1) % order.length]
      try { localStorage.setItem(KEY, next) } catch (e) {}
      apply(next)
      if (window.__syncGiscus) window.__syncGiscus()
    })

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if ((btn.getAttribute('data-mode') || 'auto') === 'auto') apply('auto')
    })
  }

  /* ---------- 移动端菜单 ---------- */
  function initMenu() {
    var toggle = document.querySelector('[data-menu-toggle]')
    var nav = document.querySelector('.nav')
    if (!toggle || !nav) return
    toggle.addEventListener('click', function (e) {
      e.stopPropagation()
      var open = nav.classList.toggle('open')
      toggle.setAttribute('aria-expanded', String(open))
    })
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !toggle.contains(e.target)) nav.classList.remove('open')
    })
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') nav.classList.remove('open')
    })
  }

  /* ---------- 导航高亮 ---------- */
  function initNavActive() {
    var path = location.pathname
    document.querySelectorAll('.nav-link, .nav-dropdown a').forEach(function (a) {
      var href = a.getAttribute('href')
      if (!href) return
      if (href === '/' ? path === '/' : path.indexOf(href) === 0) a.classList.add('active')
    })
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
        btn.textContent = '已复制 ✓'
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
    function open(src, alt) {
      img.src = src
      img.alt = alt || ''
      box.classList.add('show')
      document.body.style.overflow = 'hidden'
    }
    function close() {
      box.classList.remove('show')
      document.body.style.overflow = ''
    }
    document.addEventListener('click', function (e) {
      var target = e.target
      if (target.classList && target.classList.contains('md-img')) {
        e.preventDefault()
        open(target.getAttribute('src'), target.getAttribute('alt'))
      }
    })
    box.addEventListener('click', close)
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close() })
  }

  /* ---------- 本地搜索 ---------- */
  function initSearch() {
    if (!FEATURES.search) return
    var mask = document.querySelector('.search-mask')
    var input = document.querySelector('.search-input')
    var results = document.querySelector('.search-results')
    if (!mask || !input || !results) return

    var index = null
    var loading = false
    var cursor = -1

    function load() {
      if (index || loading) return
      loading = true
      fetch(SITE.searchPath || '/search.json')
        .then(function (r) { return r.json() })
        .then(function (data) { index = data; loading = false; if (input.value) search(input.value) })
        .catch(function () { loading = false; results.innerHTML = '<div class="search-empty">搜索索引加载失败</div>' })
    }

    function open() {
      mask.classList.add('show')
      document.body.style.overflow = 'hidden'
      input.focus()
      input.select()
      load()
    }
    function close() {
      mask.classList.remove('show')
      document.body.style.overflow = ''
      cursor = -1
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
      })
    }

    function highlight(text, terms) {
      var out = escapeHtml(text)
      terms.forEach(function (t) {
        if (!t) return
        var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi')
        out = out.replace(re, '<em>$1</em>')
      })
      return out
    }

    function search(query) {
      var q = query.trim().toLowerCase()
      cursor = -1
      if (!q) {
        results.innerHTML = '<div class="search-empty">输入关键词搜索文章标题与正文</div>'
        return
      }
      if (!index) {
        results.innerHTML = '<div class="search-empty">正在加载索引…</div>'
        return
      }
      var terms = q.split(/\s+/).filter(Boolean)
      var scored = []
      index.forEach(function (item) {
        var title = (item.title || '').toLowerCase()
        var content = (item.content || '').toLowerCase()
        var score = 0
        terms.forEach(function (t) {
          if (title.indexOf(t) > -1) score += 12
          var idx = content.indexOf(t)
          if (idx > -1) {
            score += 4
            var count = content.split(t).length - 1
            score += Math.min(count, 6)
          }
        })
        if (score > 0) scored.push({ item: item, score: score })
      })
      scored.sort(function (a, b) { return b.score - a.score })
      var list = scored.slice(0, 20)

      if (!list.length) {
        results.innerHTML = '<div class="search-empty">没有找到与「' + escapeHtml(query) + '」相关的内容</div>'
        return
      }

      results.innerHTML = list.map(function (entry) {
        var item = entry.item
        var excerpt = item.excerpt || (item.content || '').slice(0, 110)
        return '<a class="search-result" href="' + item.url + '">' +
          '<div class="r-title">' + highlight(item.title, terms) + '</div>' +
          '<div class="r-excerpt">' + highlight(excerpt, terms) + '</div>' +
          '</a>'
      }).join('')
    }

    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-search-open]')) { e.preventDefault(); open() }
      if (e.target === mask) close()
    })
    input.addEventListener('input', function () { search(input.value) })

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); open(); return
      }
      if (e.key === '/' && !mask.classList.contains('show') &&
        !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
        e.preventDefault(); open(); return
      }
      if (!mask.classList.contains('show')) return
      if (e.key === 'Escape') { close(); return }
      var items = Array.prototype.slice.call(results.querySelectorAll('.search-result'))
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (!items.length) return
        cursor += e.key === 'ArrowDown' ? 1 : -1
        if (cursor < 0) cursor = items.length - 1
        if (cursor >= items.length) cursor = 0
        items.forEach(function (el, i) { el.classList.toggle('active', i === cursor) })
        items[cursor].scrollIntoView({ block: 'nearest' })
      }
      if (e.key === 'Enter' && cursor > -1 && items[cursor]) {
        location.href = items[cursor].getAttribute('href')
      }
    })

    results.innerHTML = '<div class="search-empty">输入关键词搜索文章标题与正文</div>'
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
      if (!config) return
      var iframe = document.querySelector('iframe.giscus-frame')
      if (!iframe || !iframe.contentWindow) return
      iframe.contentWindow.postMessage(
        { giscus: { setConfig: { theme: themeOf() } } },
        'https://giscus.app',
      )
    }
  }

  /* ---------- 新窗口打开外链 ---------- */
  function initExternalLinks() {
    document.querySelectorAll('.article-body a[href^="http"]').forEach(function (a) {
      var sameHost = false
      try { sameHost = new URL(a.href).hostname === location.hostname } catch (e) {}
      if (!sameHost) {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      }
    })
  }

  /* ---------- 启动 ---------- */
  function boot() {
    initTheme()
    initMenu()
    initNavActive()
    initProgress()
    initBackTop()
    initToc()
    initCopy()
    initLightbox()
    initSearch()
    initGiscus()
    initExternalLinks()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()
