/** Read-only virtual paths. Commands never touch a real filesystem. */
export function unquote(value) {
  const text = String(value).trim()
  if (text.startsWith('"') && text.endsWith('"')) {
    try { return JSON.parse(text) } catch { return text.slice(1, -1) }
  }
  return text.length >= 2 && text.startsWith("'") && text.endsWith("'") ? text.slice(1, -1) : text
}

export function normalizePath(cwd, target = '') {
  if (target === '~') target = '/'
  else if (target.startsWith('~/')) target = target.slice(1)
  const segments = []
  for (const part of (target.startsWith('/') ? target : `${cwd}/${target}`).split('/')) {
    if (!part || part === '.') continue
    if (part === '..') segments.pop()
    else segments.push(part)
  }
  return '/' + segments.join('/')
}

function resolvePath(directories, cwd, target) {
  const pathname = normalizePath(cwd, target)
  const category = pathname.split('/')[1]
  // Old shortcuts such as `cd 技术` still work from the root.
  if (!Object.hasOwn(directories, '/' + category) && Object.hasOwn(directories, '/categories/' + category)) {
    return '/categories' + pathname
  }
  return pathname
}

export function readDirectory(directories, cwd, target = '') {
  const pathname = resolvePath(directories, cwd, target)
  const directory = directories[pathname]
  if (!directory) throw new Error('目录不存在。')
  return { path: pathname, ...directory }
}

export function resolveFile(directories, cwd, target) {
  if (!target) return null
  const pathname = resolvePath(directories, cwd, target)
  const slash = pathname.lastIndexOf('/')
  const parent = pathname.slice(0, slash) || '/'
  const name = pathname.slice(slash + 1)
  const inDirectory = (directory) => directories[directory]?.entries.find(entry => entry.type === 'file' && entry.name === name)
  return inDirectory(parent) || (parent === '/' && !target.includes('/') ? inDirectory('/posts') : null) || null
}

export function completePath(directories, cwd, value, onlyDirectories = false) {
  // An opening quote is common while typing a path containing spaces.
  const target = /^['"]/.test(value) && (value.length === 1 || value.at(-1) !== value[0]) ? value.slice(1) : unquote(value)
  const slash = target.lastIndexOf('/')
  const prefix = target.slice(0, slash + 1)
  const partial = target.slice(slash + 1)
  try {
    return readDirectory(directories, cwd, prefix || '.').entries
      .filter(entry => (!onlyDirectories || entry.type === 'directory') && entry.name.startsWith(partial))
      .map(entry => prefix + entry.name + (entry.type === 'directory' ? '/' : ''))
  } catch { return [] }
}

export function parseList(args) {
  const words = args.match(/"(?:\\.|[^"\\])*"|'[^']*'|[^\s"']+/g) || []
  const directories = []
  let long = false
  let tag = ''
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (word === '-l') long = true
    else if (word === '-t') {
      const next = words[++i]
      if (!next || next.startsWith('-')) throw new Error('-t 需要标签名。')
      tag = unquote(next).toLowerCase()
    } else if (word.startsWith('-')) throw new Error(`未知参数 ${word}。用法：ls [-l] [目录] [-t 标签]`)
    else directories.push(unquote(word))
  }
  return { target: directories.join(' '), long, tag }
}
