/** Read-only virtual directories. Paths never touch a real filesystem. */
export function unquote(value) {
  const text = String(value).trim()
  return /^("[\s\S]*"|'[\s\S]*')$/.test(text) ? text.slice(1, -1) : text
}

export function normalizePath(cwd, value = '') {
  let target = unquote(value)
  if (target === '~') target = '/'
  else if (target.startsWith('~/')) target = target.slice(1)
  const parts = (target.startsWith('/') ? target : cwd + '/' + target).split('/')
  const segments = []
  for (const part of parts) {
    if (!part || part === '.') continue
    if (part === '..') segments.pop()
    else segments.push(part)
  }
  return '/' + segments.join('/')
}

export function readDirectory(directories, cwd, target = '') {
  const pathname = normalizePath(cwd, target)
  if (pathname === '/') return { path: '/', entries: directories.map(dir => ({ ...dir, type: 'directory' })) }
  const dir = directories.find(dir => '/' + dir.name === pathname)
  if (!dir) throw new Error('目录不存在。')
  return { path: pathname, entries: dir.files.map(file => ({ ...file, type: 'file' })) }
}

export function resolveFile(directories, cwd, target) {
  const pathname = normalizePath(cwd, target)
  const candidates = []
  for (const dir of directories) {
    for (const file of dir.files) {
      if ('/' + dir.name + '/' + file.name === pathname ||
          (cwd === '/' && !unquote(target).includes('/') && file.name === unquote(target))) candidates.push(file)
    }
  }
  const unique = [...new Map(candidates.map(file => [file.url, file])).values()]
  return unique.length === 1 ? unique[0] : null
}

export function completePath(directories, cwd, value, onlyDirectories = false) {
  const target = unquote(value)
  const slash = target.lastIndexOf('/')
  const prefix = slash >= 0 ? target.slice(0, slash + 1) : ''
  const partial = target.slice(slash + 1)
  try {
    return readDirectory(directories, cwd, prefix || '.').entries
      .filter(entry => (!onlyDirectories || entry.type === 'directory') && entry.name.startsWith(partial))
      .map(entry => prefix + entry.name + (entry.type === 'directory' ? '/' : ''))
  } catch { return [] }
}
