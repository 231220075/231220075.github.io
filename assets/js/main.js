import { initTerminal } from './terminal.mjs'
import { applyBackgroundMotion, applyThemePreference, themeModes } from './themes.mjs'

/* Summer Flower — read-only blog shell. */
(function () {
  'use strict'
  var SITE = window.__SITE__ || {}
  var FEATURES = SITE.features || {}

  var settings = document.querySelector('[data-theme-settings]')

  function applyTheme(mode) {
    var selected = applyThemePreference(themeModes, mode)
    var option = settings && settings.querySelector('input[value="' + selected + '"]')
    if (option) option.checked = true
    if (window.__syncGiscus) window.__syncGiscus()
  }

  function initTheme() {
    applyTheme()
    var motion = applyBackgroundMotion()
    if (settings) {
      var motionControl = settings.querySelector('input[name="background-motion"]')
      if (motionControl) motionControl.checked = motion
      settings.disabled = false
      settings.addEventListener('change', function (event) {
        if (event.target.name === 'theme') applyTheme(event.target.value)
        if (event.target === motionControl) applyBackgroundMotion(motionControl.checked)
      })
    }
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (document.documentElement.dataset.themeMode === 'auto') applyTheme('auto')
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
      return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
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
    Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]) })
    host.appendChild(s)

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
    initTheme(); initTerminal(SITE, applyTheme); initProgress(); initBackTop(); initToc(); initCopy(); initLightbox(); initGiscus()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
  else boot()
})()
