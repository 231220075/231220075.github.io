import { completePath, normalizePath, parseList, readDirectory, resolveFile, unquote } from './filesystem.mjs'
import { settingsFile } from './themes.mjs'

const commands = [
  { usage: 'ls [-l] [dir] [-t tag]', label: '列出目录', command: 'ls -l ~/posts', href: '/archives/' },
  { usage: 'cd [dir]', label: '切换目录', prefill: 'cd ' },
  { usage: 'pwd', label: '显示当前路径', command: 'pwd' },
  { usage: 'cat <file>', label: '阅读文章或页面', prefill: 'cat ' },
  { usage: 'open <file | title>', label: '按文件名或标题打开', prefill: 'open ' },
  { usage: 'rg <pattern>', label: '检索文章', prefill: 'rg ' },
  { usage: 'whoami', label: '关于', href: '/about/' },
  { usage: 'proj', label: '项目', href: '/proj/' },
  { usage: 'archive', label: '归档', href: '/archives/' },
  { usage: 'tags', label: '标签', href: '/tags/' },
  { usage: 'categories', label: '分类', href: '/categories/' },
  { usage: 'links', label: '友链', href: '/links/' },
  { usage: 'open github', label: 'GitHub', route: 'github' },
  { usage: 'open email', label: '邮件', route: 'email' },
  { usage: settingsFile.name, label: settingsFile.title, href: settingsFile.url },
  { usage: 'fastfetch', label: '显示博客信息', command: 'fastfetch', href: '/' },
  { usage: 'clear', label: '清屏', command: 'clear' },
  { usage: 'reset', label: '重置终端', command: 'reset', href: '/' },
]

const routes = Object.fromEntries(commands.filter(entry => entry.href && !entry.command).map(entry => [entry.usage, entry.href]))
Object.assign(routes, { home: '/', about: '/about/', archives: '/archives/' })
const names = [...new Set(commands.map(entry => entry.usage.split(' ')[0]).concat(
  Object.keys(routes), 'help', 'posts', 'search', 'grep', 'github', 'email',
))]

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}

function promptPath(cwd) {
  return cwd === '/' ? '~' : '~' + cwd
}

export function quoteArgument(value) {
  return /['"\s\\]/.test(value) ? JSON.stringify(value) : value
}

export function renderPathSuffix(cwd) {
  const [, section, ...rest] = cwd.split('/')
  const href = { posts: '/archives/', tags: '/tags/', categories: '/categories/' }[section]
  const prefix = section ? `/${section}` : ''
  return (href ? `<a href="${href}">${escapeHtml(prefix)}</a>` : escapeHtml(prefix)) +
    (rest.length ? '/' + escapeHtml(rest.join('/')) : '')
}

export function renderCommand(cwd, command, homeLink = false) {
  const path = homeLink ? `<a href="/" aria-label="首页">~</a>${renderPathSuffix(cwd)}` : escapeHtml(promptPath(cwd))
  return `<div class="command-entry"><div class="prompt-path">${path}</div><div><span class="prompt-glyph" aria-hidden="true">&gt;&gt;</span> ${escapeHtml(command)}</div></div>`
}

export function renderHelp({ github, email }) {
  const external = { github, email: `mailto:${email}` }
  return `<dl class="help-list">${commands.map(({ usage, label, href, command, prefill, route }) => {
    const text = escapeHtml(usage)
    const action = command ? ` data-command="${escapeHtml(command)}"` : ''
    const target = href || external[route]
    const input = prefill ? ` data-prefill="${escapeHtml(prefill)}"` : action
    const control = target ? `<a href="${escapeHtml(target)}"${action}>${text}</a>` :
      `<span class="help-fallback">${text}</span><button class="help-command" type="button"${input}>${text}</button>`
    return `<dt>${control}</dt><dd>${escapeHtml(label)}</dd>`
  }).join('')}</dl>`
}

function fileList(result, { long, tag }) {
  const entries = result.entries.filter(entry => !tag || entry.tags?.some(name => name.toLowerCase() === tag))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  if (!entries.length) return ''
  return `<ul class="ls-list">${entries.map(entry => {
    const directory = entry.type === 'directory'
    const name = quoteArgument(entry.name + (directory ? '/' : ''))
    const action = directory ? ` class="shell-directory" data-command="${escapeHtml('ls ' + quoteArgument(normalizePath(result.path, entry.name)))}"` : ''
    const title = entry.title ? ` title="${escapeHtml(entry.title)}"` : ''
    const link = `<a href="${escapeHtml(entry.url)}"${action}${title}>${escapeHtml(name)}</a>`
    if (!long) return `<li>${link}</li>`
    const mode = directory ? 'dr-xr-xr-x' : '-r--r--r--'
    const date = entry.date ? `<time datetime="${escapeHtml(entry.date)}">${escapeHtml(entry.date)}</time>` : '<span></span>'
    const tags = entry.tags?.length ? ` <span class="ls-tags">${escapeHtml(entry.tags.map(t => '#' + t).join(' '))}</span>` : ''
    return `<li class="ls-long"><span class="ls-mode">${mode}</span>${date}<span>${link}${tags}</span></li>`
  }).join('')}</ul>`
}

function resultLinks(entries, terms) {
  const pattern = new RegExp('(' + terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi')
  function highlight(value) {
    return value.split(pattern).map((piece, i) => i % 2 ? `<mark>${escapeHtml(piece)}</mark>` : escapeHtml(piece)).join('')
  }
  return entries.slice(0, 20).map(({ item }) => {
    const body = item.content || ''
    const lowered = body.toLowerCase()
    const matches = terms.map(term => lowered.indexOf(term)).filter(index => index >= 0)
    const start = matches.length ? Math.max(0, Math.min(...matches) - 30) : 0
    const end = start + 145
    const excerpt = matches.length ? `${start ? '…' : ''}${body.slice(start, end)}${body.length > end ? '…' : ''}` : item.title
    return `<div class="rg-line"><a class="rg-path" href="${escapeHtml(item.url)}" title="${escapeHtml(item.title)}">${escapeHtml(item.path || item.url)}</a>:${highlight(excerpt)}</div>`
  }).join('')
}

export function initTerminal(site) {
  const form = document.querySelector('.command-form')
  if (!form) return
  const terminal = form.closest('.terminal')
  const input = form.elements.command
  const output = terminal.querySelector('.command-output')
  const startup = terminal.querySelector('[data-startup]')
  const banner = startup.querySelector('.home-overview')
  const pathLabel = form.querySelector('[data-prompt-path]')
  const external = { github: site.github, email: `mailto:${site.email}` }
  let cwd = terminal.dataset.cwd || '/'
  let history = []
  try {
    history = JSON.parse(sessionStorage.getItem('sf-commands') || '[]')
    if (!Array.isArray(history) || history.some(entry => typeof entry !== 'string')) history = []
  } catch {}
  let cursor = history.length, pending = '', queue = Promise.resolve()
  let directories, vfsPromise, indexPromise

  function focusPrompt() {
    input.focus({ preventScroll: true })
  }

  async function loadJson(path) {
    const response = await fetch(path, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
  function loadVfs() {
    if (!vfsPromise) vfsPromise = loadJson('/vfs.json').then(data => directories = data).catch(error => {
      vfsPromise = null
      throw error
    })
    return vfsPromise
  }
  function loadIndex() {
    if (!indexPromise) indexPromise = loadJson('/search.json').catch(error => {
      indexPromise = null
      throw error
    })
    return indexPromise
  }
  function setDirectory(path) {
    cwd = path
    pathLabel.innerHTML = renderPathSuffix(cwd)
  }
  function clear() {
    startup.hidden = true
    output.replaceChildren()
  }
  function showError(result, message) {
    result.classList.add('terminal-error')
    result.textContent = message
  }

  async function find(query, name, result) {
    const byTitle = name === 'cat' || name === 'open'
    query = query.trim()
    if (!query) return showError(result, `usage: ${name} ${byTitle ? '<file>' : '<pattern>'}`)
    let index
    try { index = await loadIndex() } catch { return showError(result, `${name}: 无法读取索引`) }
    const lower = query.toLowerCase()
    const terms = [...new Set(lower.split(/\s+/))]
    const entries = index.map(item => {
      const title = item.title.toLowerCase()
      const haystack = byTitle ? title : [title, item.tags.join(' '), item.content].join(' ').toLowerCase()
      const score = title === lower ? 100 : terms.filter(term => title.includes(term)).length
      return { item, score, match: terms.every(term => haystack.includes(term)) }
    }).filter(entry => entry.match).sort((a, b) => b.score - a.score)
    if (byTitle && (entries.length === 1 || entries[0]?.score === 100)) {
      location.assign(entries[0].item.url)
      return
    }
    if (byTitle && !entries.length) return showError(result, `${name}: ${query}: 文件不存在`)
    result.innerHTML = resultLinks(entries, terms)
  }

  async function execute(command) {
    const [, verb, args = ''] = command.match(/^(\S+)(?:\s+([\s\S]*))?$/)
    const name = verb.toLowerCase(), arg = unquote(args)
    if (name === 'clear') { clear(); return }
    if (name === 'reset') {
      if (!banner) { location.assign('/'); return }
      clear()
      setDirectory('/')
      startup.hidden = false
      return
    }
    const turn = document.createElement('div')
    turn.className = 'terminal-turn'
    turn.innerHTML = renderCommand(cwd, command)
    const result = document.createElement('div')
    result.className = 'terminal-result'
    turn.append(result)
    output.append(turn)

    if (name === 'fastfetch') {
      if (banner) result.append(banner.cloneNode(true))
      else location.assign('/')
    } else if (name === 'help') result.innerHTML = renderHelp(site)
    else if (name === 'pwd') result.textContent = cwd
    else if (Object.hasOwn(routes, name) || Object.hasOwn(external, name)) location.assign(routes[name] || external[name])
    else if (name === 'open' && Object.hasOwn(external, arg)) location.assign(external[arg])
    else if (['rg', 'search', 'grep'].includes(name)) await find(arg, name, result)
    else if (['ls', 'cd', 'posts', 'open', 'cat'].includes(name)) {
      try {
        await loadVfs().catch(() => { throw new Error('无法读取目录') })
        if (name === 'open' || name === 'cat') {
          const file = resolveFile(directories, cwd, arg)
          if (file) location.assign(file.url)
          else await find(arg, name, result)
        } else {
          const options = name === 'ls' ? parseList(args) : { target: name === 'posts' ? '~/posts' : arg || '~' }
          const directory = readDirectory(directories, cwd, options.target)
          if (name !== 'ls') setDirectory(directory.path)
          if (name !== 'cd') result.innerHTML = fileList(directory, options)
        }
      } catch (error) {
        showError(result, `${name}: ${error.message}`)
      }
    } else showError(result, `command not found: ${verb}`)
    return turn.querySelector('.command-entry')
  }

  function submit(raw) {
    focusPrompt()
    const command = raw.trim()
    if (!command) return queue
    if (history.at(-1) !== command) history = [...history.slice(-79), command]
    try { sessionStorage.setItem('sf-commands', JSON.stringify(history)) } catch {}
    cursor = history.length
    pending = input.value = ''
    queue = queue.then(async () => {
      const entry = await execute(command)
      const target = document.activeElement === input || !entry ? form : entry
      target.scrollIntoView({ block: 'nearest', behavior: 'instant' })
    })
    return queue
  }

  form.addEventListener('submit', event => { event.preventDefault(); submit(input.value) })
  input.addEventListener('focus', () => loadVfs().catch(() => {}))
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const target = event.target
    const control = target.closest('[data-command], [data-prefill]')
    if (control) {
      event.preventDefault()
      if (control.dataset.prefill) {
        input.value = control.dataset.prefill
        input.focus()
      } else submit(control.dataset.command)
      return
    }
    if (event.detail !== 1 || !window.getSelection()?.isCollapsed || document.querySelector('.lightbox.show')) return
    const interactive = 'a, button, input, textarea, select, label, summary, audio, video, iframe, [tabindex], [contenteditable], .md-img'
    if (target.closest(interactive)) return
    focusPrompt()
    form.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  })
  input.addEventListener('keydown', event => {
    if (event.isComposing || event.keyCode === 229) return
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (cursor === history.length) pending = input.value
      cursor = Math.max(0, Math.min(history.length, cursor + (event.key === 'ArrowUp' ? -1 : 1)))
      input.value = cursor === history.length ? pending : history[cursor]
      input.setSelectionRange(input.value.length, input.value.length)
    }
    if (event.key === 'Tab' && !event.shiftKey && input.value && input.selectionEnd === input.value.length) {
      const path = /^(cd|ls(?:\s+-l)?|cat|open)\s+(.*)$/.exec(input.value)
      const matches = path && directories ? completePath(directories, cwd, path[2], /^(cd|ls)/.test(path[1]))
        .map(value => `${path[1]} ${quoteArgument(value)}`)
        : names.filter(name => name.startsWith(input.value.toLowerCase())).map(name => name + ' ')
      if (matches.length === 1 && matches[0] !== input.value) { event.preventDefault(); input.value = matches[0] }
    }
    if (event.key === 'Escape') { input.value = ''; cursor = history.length }
    if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); submit('clear') }
  })
  document.addEventListener('keydown', event => {
    if (event.isComposing || event.keyCode === 229 || event.defaultPrevented || document.querySelector('.lightbox.show')) return
    const active = document.activeElement
    const typing = active?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active?.tagName)
    if ((event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) ||
        ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault()
      input.focus()
    }
  })
  form.hidden = false
  document.documentElement.classList.add('terminal-ready')
  if (!location.hash && document.activeElement === document.body && matchMedia('(hover: hover) and (pointer: fine)').matches) focusPrompt()
}
