import { lazy, Suspense } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import ContentBoundary from './ContentBoundary'
import ContentError from './ContentError'

it('页面模块下载失败显示刷新 UI，换路由后错误边界可以恢复', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const failure = new Error('Failed to fetch dynamically imported module')
  const suppressExpectedError = (event: ErrorEvent) => {
    if (event.error === failure) event.preventDefault()
  }
  window.addEventListener('error', suppressExpectedError)
  try {
    const Broken = lazy(() => Promise.reject(failure))
    const { rerender } = render(
      <ContentBoundary resetKey="broken"><Suspense fallback="正在加载"><Broken /></Suspense></ContentBoundary>,
    )
    expect((await screen.findByRole('alert')).textContent).toContain('页面暂时无法显示')
    expect(screen.getByRole('button', { name: '刷新页面' })).toBeTruthy()
    // lazy 会缓存失败，不展示无法真正重新下载模块的「重试」按钮。
    expect(screen.queryByRole('button', { name: '重新尝试' })).toBeNull()
    rerender(<ContentBoundary resetKey="other">其他页面</ContentBoundary>)
    expect(screen.getByText('其他页面')).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  } finally {
    window.removeEventListener('error', suppressExpectedError)
  }
})

it('正常切换文章时保留列表搜索等子组件状态', () => {
  const { rerender } = render(<ContentBoundary resetKey="one"><input aria-label="搜索" /></ContentBoundary>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Docker' } })
  rerender(<ContentBoundary resetKey="two"><input aria-label="搜索" /></ContentBoundary>)
  expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Docker')
})

it('超时提示提供可操作的重试入口', () => {
  const retry = vi.fn()
  render(<ContentError kind="timeout" onRetry={retry} />)
  expect(screen.getByRole('alert').textContent).toContain('内容加载超时')
  fireEvent.click(screen.getByRole('button', { name: '重新尝试' }))
  expect(retry).toHaveBeenCalledOnce()
})
