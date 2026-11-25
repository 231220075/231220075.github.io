export const settingsFile = { name: 'settings', title: '配色设置', url: '/settings/' }

export const themes = {
  dark: '松墨',
  slate: '蓝灰',
  roast: '暖棕',
  dusk: '灰紫',
  light: '浅纸',
  auto: '跟随系统',
}

export const themeModes = Object.keys(themes)
export const themeUsage = `theme [${themeModes.join('|')}]`

// Also inlined by the generator so saved colors apply before the initial paint.
export function applyThemePreference(modes, choice) {
  const root = document.documentElement
  const explicit = choice !== undefined
  if (!explicit) {
    try { choice = localStorage.getItem('sf-theme') } catch { choice = root.dataset.themeMode }
  }
  if (!modes.includes(choice)) choice = 'dark'
  root.dataset.themeMode = choice
  root.dataset.theme = choice === 'auto'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : choice
  const color = getComputedStyle(root).getPropertyValue('--bg').trim()
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta && color) meta.content = color
  if (explicit) {
    try { localStorage.setItem('sf-theme', choice) } catch {}
  }
  return choice
}

export function applyBackgroundMotion(enabled) {
  const root = document.documentElement
  if (enabled === undefined) {
    try { enabled = localStorage.getItem('sf-background-motion') === 'on' }
    catch { enabled = root.hasAttribute('data-background-motion') }
  } else {
    try { localStorage.setItem('sf-background-motion', enabled ? 'on' : 'off') } catch {}
  }
  root.toggleAttribute('data-background-motion', enabled)
  return enabled
}
