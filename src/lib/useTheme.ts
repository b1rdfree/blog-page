import { useEffect, useLayoutEffect, useState } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
const STORAGE_KEY = 'nonight-theme'
const QUERY = '(prefers-color-scheme: dark)'

function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* 存储被禁用时仍允许本次访问切换主题。 */ }
  return 'system'
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)
  const [systemDark, setSystemDark] = useState(() => window.matchMedia(QUERY).matches)
  const theme = preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    const media = window.matchMedia(QUERY)
    const change = () => setSystemDark(media.matches)
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setPreference(readPreference())
    }
    change()
    media.addEventListener('change', change)
    window.addEventListener('storage', sync)
    return () => {
      media.removeEventListener('change', change)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#080d17' : '#f2f6fb')
  }, [theme])

  const chooseTheme = (value: ThemePreference) => {
    setPreference(value)
    try {
      if (value === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, value)
    } catch { /* 不影响当前页面。 */ }
  }
  return { theme, preference, chooseTheme }
}
