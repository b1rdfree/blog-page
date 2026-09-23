import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useTheme } from './useTheme'
import ThemeToggle from '../components/ThemeToggle'

let dark = false
let listeners: Set<() => void>

beforeEach(() => {
  localStorage.clear()
  dark = false
  listeners = new Set()
  vi.stubGlobal('matchMedia', () => ({
    get matches() { return dark },
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  }))
})
afterEach(() => { delete document.documentElement.dataset.theme })

function systemChanges(value: boolean) {
  act(() => { dark = value; listeners.forEach((cb) => cb()) })
}

it('首次跟随系统，系统变化即时生效，卸载清理监听', () => {
  const { result, unmount } = renderHook(useTheme)
  expect(result.current.preference).toBe('system')
  expect(document.documentElement.dataset.theme).toBe('light')
  systemChanges(true)
  expect(document.documentElement.dataset.theme).toBe('dark')
  unmount()
  expect(listeners.size).toBe(0)
})

it('手动选择可持久保存并覆盖系统，恢复自动后重新跟随', () => {
  localStorage.setItem('nonight-theme', 'dark')
  const { result } = renderHook(useTheme)
  expect(result.current.theme).toBe('dark')
  act(() => result.current.chooseTheme('light'))
  expect(localStorage.getItem('nonight-theme')).toBe('light')
  systemChanges(true)
  expect(result.current.theme).toBe('light')
  act(() => result.current.chooseTheme('system'))
  expect(localStorage.getItem('nonight-theme')).toBeNull()
  expect(result.current.theme).toBe('dark')
})

it('存储被浏览器禁止时仍可切换', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied') })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied') })
  const { result } = renderHook(useTheme)
  act(() => result.current.chooseTheme('dark'))
  expect(result.current.theme).toBe('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
})

it('其他标签页的主题选择可以同步', () => {
  const { result } = renderHook(useTheme)
  act(() => {
    localStorage.setItem('nonight-theme', 'dark')
    window.dispatchEvent(new StorageEvent('storage', { key: 'nonight-theme', newValue: 'dark' }))
  })
  expect(result.current.preference).toBe('dark')
})

it('主题按钮具有名称和选中状态，点击后同步外观', () => {
  function Controls() {
    const { preference, chooseTheme } = useTheme()
    return <ThemeToggle preference={preference} onChange={chooseTheme} />
  }
  render(<Controls />)
  expect(screen.getByRole('button', { name: '跟随系统' }).getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: '黑夜模式' }))
  expect(screen.getByRole('button', { name: '黑夜模式' }).getAttribute('aria-pressed')).toBe('true')
  expect(document.documentElement.dataset.theme).toBe('dark')
})
