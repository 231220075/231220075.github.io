import { completePath, normalizePath, parseList, readDirectory, resolveFile, unquote } from './filesystem.mjs'

const commands = [
  { usage: 'ls [-l] [目录] [-t 标签]', label: '列出文件，显示详情或按标签筛选', command: 'ls -l ~/posts', href: '/archives/' },
  { usage: 'cd <目录>', label: '进入目录并列出文件', prefill: 'cd ' },
  { usage: 'pwd', label: '显示当前路径', command: 'pwd' },
  { usage: 'cat <文件>', label: '在原网址阅读文章或页面', prefill: 'cat ' },
  { usage: 'open <文件 / 标题>', label: '按文件名或文章标题打开', prefill: 'open ' },
  { usage: 'rg <关键词>', label: '搜索标题、标签和正文', prefill: 'rg ' },
  { usage: 'whoami', label: '关于', href: '/about/' },
  { usage: 'proj', label: '项目', href: '/proj/' },
  { usage: 'archive', label: '归档', href: '/archives/' },
  { usage: 'tags', label: '所有标签', href: '/tags/' },
  { usage: 'categories', label: '所有分类', href: '/categories/' },
  { usage: 'links', label: '友链', href: '/links/' },
  { usage: 'open github', label: 'GitHub', route: 'github' },
  { usage: 'open email', label: '邮件', route: 'email' },
  { usage: 'theme [dark|light|auto]', label: '切换主题', prefill: 'theme ' },
  { usage: 'clear', label: '清空输出', command: 'clear' },
  { usage: 'reset', label: '回到首页，恢复初始视图', command: 'reset', href: '/' },
]

const routes = Object.fromEntries(commands.filter(entry => entry.href && !entry.command).map(entry => [entry.usage, entry.href]))
Object.assign(routes, { home: '/', about: '/about/', archives: '/archives/' })
const names = [...new Set(commands.map(entry => entry.usage.split(' ')[0]).concat(
  Object.keys(routes), 'help', 'posts', 'fastfetch', 'search', 'grep', 'github', 'email',
))]

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}

export function renderHelp({ github, email }) {
  const external = { github, email: `mailto:${email}` }
  const items = commands.map(({ usage, label, href, command, prefill, route }) => {
    const content = `${escapeHtml(usage)}<span>${escapeHtml(label)}</span>`
    const action = command ? ` data-command="${escapeHtml(command)}"` : ''
    const target = href || external[route]
    if (target) return `<a href="${escapeHtml(target)}"${action}>${content}</a>`
    const input = prefill ? ` data-prefill="${escapeHtml(prefill)}"` : action
    return `<p class="help-fallback">${content}</p><button type="button" class="help-command"${input}>${content}</button>`
  }).join('')
  return `<div class="help-list">${items}</div><p class="shortcut-note">/ 或 ⌘/Ctrl K 聚焦 · ↑ ↓ 历史 · Tab 补全 · Esc 清空输入</p>`
}

function fileList(result, { long, tag }, directories) {
  const entries = tag ? result.entries.filter(entry => entry.tags?.some(name => name.toLowerCase() === tag)) : result.entries
  const parent = result.path === '/' ? '' : directoryLink({
    name: '..', url: directories[normalizePath(result.path, '..')].url,
  }, normalizePath(result.path, '..'))
  const rows = entries.map(entry => {
    if (entry.type === 'directory') return directoryLink(entry, normalizePath(result.path, entry.name))
    const { name, url, title, date, tags } = entry
    return `<a class="file-entry post-entry${long ? ' file-detail' : ''}" href="${escapeHtml(url)}">` +
      `<span class="pixel-file" aria-hidden="true"></span><span class="file-name">${escapeHtml(long ? title : name)}</span>` +
      (long && date ? `<time class="entry-meta" datetime="${escapeHtml(date)}">${escapeHtml(date)}</time>` : '') +
      (long && title !== name ? `<span class="file-meta">${escapeHtml(name)}${tags?.length ? ` <span class="file-tags">${tags.map(t => '#' + escapeHtml(t)).join(' ')}</span>` : ''}</span>` : '') + '</a>'
  }).join('')
  return `<div class="file-list">${parent}${rows || `<p>${tag ? '没有匹配的文章。' : '空目录。'}</p>`}</div>`
}

function directoryLink(entry, path) {
  const command = 'cd ' + JSON.stringify(path)
  return `<a class="file-entry directory-entry" href="${escapeHtml(entry.url)}" data-command="${escapeHtml(command)}">` +
    `<span class="pixel-folder" aria-hidden="true"></span><span class="file-name">${escapeHtml(entry.name)}/</span></a>`
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
    const size = 145
    const excerpt = matches.length ? `${start ? '…' : ''}${body.slice(start, start + size)}${body.length > start + size ? '…' : ''}` : item.excerpt
    return `<a class="search-result" href="${escapeHtml(item.url)}"><span class="r-title">${highlight(item.title)}</span>` +
      (excerpt ? `<span class="r-excerpt">${highlight(excerpt)}</span>` : '') + '</a>'
  }).join('')
}

export function initTerminal(site, applyTheme) {
  const form = document.querySelector('.command-form')
  if (!form) return
  const terminal = form.closest('.terminal')
  const input = form.elements.command
  const output = terminal.querySelector('.command-output')
  const workspace = terminal.querySelector('.terminal-workspace')
  const overview = workspace.querySelector('.home-overview')
  const promptPath = form.querySelector('[data-prompt-path]')
  const external = { github: site.github, email: `mailto:${site.email}` }
  let cwd = terminal.dataset.cwd || '/'
  let history = []
  try {
    history = JSON.parse(sessionStorage.getItem('sf-commands') || '[]')
    if (!Array.isArray(history) || history.some(entry => typeof entry !== 'string')) history = []
  } catch {}
  let cursor = history.length, pending = '', revision = 0
  let directories, vfsPromise, indexPromise

  function loadJson(path) {
    return fetch(path).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    })
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
    promptPath.textContent = path === '/' ? '~' : '~' + path
  }
  function show(command, html) {
    if (overview) overview.hidden = true
    output.innerHTML = `<p class="command-echo">$ ${escapeHtml(command)}</p>${html}`
    output.hidden = false
    workspace.scrollTop = 0
    output.scrollTop = 0
  }
  function clear() {
    if (overview) overview.hidden = true
    output.hidden = true
    output.replaceChildren()
  }
  function reset() {
    if (!overview) { location.assign('/'); return }
    clear()
    setDirectory('/')
    overview.hidden = false
    workspace.scrollTop = 0
  }

  async function find(query, byTitle, command, token) {
    query = query.trim()
    if (!query) return show(command, `<p>${byTitle ? 'cat &lt;文件&gt; / open &lt;标题&gt;' : 'rg &lt;关键词&gt;'}</p>`)
    show(command, '<p>搜索中…</p>')
    try {
      const index = await loadIndex()
      if (token !== revision) return
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
      show(command, entries.length ? resultLinks(entries, terms) : '<p>无结果。</p>')
    } catch {
      if (token === revision) show(command, '<p>索引加载失败，请重试。</p>')
    }
  }

  async function execute(raw) {
    const command = raw.trim()
    if (!command) return
    const token = ++revision
    if (history.at(-1) !== command) history = [...history.slice(-79), command]
    try { sessionStorage.setItem('sf-commands', JSON.stringify(history)) } catch {}
    cursor = history.length
    pending = input.value = ''
    const [, verb, args = ''] = command.match(/^(\S+)(?:\s+([\s\S]*))?$/)
    const name = verb.toLowerCase(), arg = unquote(args)
    if (name === 'clear') return clear()
    if (name === 'reset' || name === 'fastfetch') return reset()
    if (name === 'help') return show(command, renderHelp(site))
    if (name === 'pwd') return show(command, `<p>${escapeHtml(cwd === '/' ? '~' : '~' + cwd)}</p>`)
    if (name === 'theme') {
      if (arg && !['dark', 'light', 'auto'].includes(arg)) return show(command, '<p>theme [dark|light|auto]</p>')
      const mode = arg || (document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
      return show(command, `<p>${applyTheme(mode, true)}</p>`)
    }
    if (Object.hasOwn(routes, name) || Object.hasOwn(external, name)) {
      location.assign(routes[name] || external[name])
      return
    }
    if (['rg', 'search', 'grep'].includes(name)) return find(arg, false, command, token)
    if (name === 'open' && Object.hasOwn(external, arg)) { location.assign(external[arg]); return }
    if (['ls', 'cd', 'posts', 'open', 'cat'].includes(name)) {
      try { await loadVfs() } catch {
        if (token === revision) show(command, '<p>目录加载失败，请重试。</p>')
        return
      }
      if (token !== revision) return
      if (name === 'open' || name === 'cat') {
        const file = resolveFile(directories, cwd, arg)
        if (file) { location.assign(file.url); return }
        return find(arg, true, command, token)
      }
      try {
        const options = name === 'ls' ? parseList(args) : { target: name === 'posts' ? '~/posts' : arg || '~' }
        const result = readDirectory(directories, cwd, options.target)
        if (name !== 'ls') setDirectory(result.path)
        show(command, fileList(result, options, directories))
      } catch (error) {
        show(command, `<p>${escapeHtml(error.message)}</p>`)
      }
      return
    }
    show(command, '<p>未知命令。<button type="button" class="text-btn accent" data-command="help">help</button></p>')
  }

  form.addEventListener('submit', event => { event.preventDefault(); execute(input.value) })
  input.addEventListener('focus', () => loadVfs().catch(() => {}))
  document.addEventListener('click', async event => {
    const control = event.target.closest('[data-command], [data-prefill]')
    if (!control || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (control.dataset.prefill) {
      input.value = control.dataset.prefill
      input.focus()
      return
    }
    const run = execute(control.dataset.command)
    const token = revision
    await run
    if (event.detail === 0 && token === revision && (document.activeElement === control || document.activeElement === document.body)) {
      const target = output.hidden ? (overview?.hidden === false ? workspace : input) : output
      target.focus()
    }
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
      const matches = path && directories ? completePath(directories, cwd, path[2], /^(cd|ls)/.test(path[1])).map(value => {
        return `${path[1]} ${/['"\s\\]/.test(value) ? JSON.stringify(value) : value}`
      }) : names.filter(name => name.startsWith(input.value.toLowerCase())).map(name => name + ' ')
      if (matches.length === 1 && matches[0] !== input.value) { event.preventDefault(); input.value = matches[0] }
    }
    if (event.key === 'Escape') { input.value = ''; cursor = history.length }
    if (event.ctrlKey && event.key.toLowerCase() === 'l') { event.preventDefault(); execute('clear') }
  })
  document.addEventListener('keydown', event => {
    if (event.isComposing || event.keyCode === 229 || event.defaultPrevented) return
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
}
