import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAsyncContent } from './useAsyncContent'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

describe('按需内容加载', () => {
  it('无文章时为空态，找不到文件时为 missing，网络错误不算 404', async () => {
    const { result, rerender } = renderHook(({ load }) => useAsyncContent(load), {
      initialProps: { load: undefined as (() => Promise<string | null>) | undefined },
    })
    expect(result.current).toMatchObject({ data: null, loading: false, missing: false, error: null })
    rerender({ load: () => Promise.resolve(null) })
    await waitFor(() => expect(result.current.missing).toBe(true))
    rerender({ load: () => Promise.reject(new Error('offline')) })
    await waitFor(() => expect(result.current.error).toBe('load'))
    expect(result.current.missing).toBe(false)
  })

  it('失败后可以重试并恢复内容', async () => {
    const load = vi.fn<() => Promise<string | null>>()
      .mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('正文')
    const { result } = renderHook(() => useAsyncContent(load))
    await waitFor(() => expect(result.current.error).toBe('load'))
    act(() => result.current.retry())
    expect(result.current).toMatchObject({ loading: true, error: null, data: null })
    await waitFor(() => expect(result.current.data).toBe('正文'))
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('15 秒超时后忽略迟到响应，重试使用新结果', async () => {
    vi.useFakeTimers()
    const old = deferred<string>()
    const next = deferred<string>()
    const load = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise)
    const { result } = renderHook(() => useAsyncContent(load))
    await act(() => vi.advanceTimersByTimeAsync(15_000))
    expect(result.current).toMatchObject({ loading: false, error: 'timeout' })
    act(() => result.current.retry())
    await act(async () => old.resolve('过期正文'))
    expect(result.current).toMatchObject({ loading: true, data: null })
    await act(async () => next.resolve('新正文'))
    expect(result.current).toMatchObject({ loading: false, error: null, data: '新正文' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('切换文章立即隐藏旧正文，并丢弃过期请求', async () => {
    const first = () => Promise.resolve('第一篇')
    const slow = deferred<string>()
    const latest = deferred<string>()
    const { result, rerender } = renderHook(({ load }) => useAsyncContent(load), { initialProps: { load: first } })
    await waitFor(() => expect(result.current.data).toBe('第一篇'))
    rerender({ load: () => slow.promise })
    expect(result.current).toMatchObject({ loading: true, data: null })
    rerender({ load: () => latest.promise })
    await act(async () => latest.resolve('第三篇'))
    await act(async () => slow.resolve('第二篇'))
    expect(result.current.data).toBe('第三篇')
  })

  it('卸载会清理超时计时器，迟到的失败不产生未处理拒绝', async () => {
    vi.useFakeTimers()
    const pending = deferred<string>()
    const load = () => pending.promise
    const { unmount } = renderHook(() => useAsyncContent(load))
    await act(async () => {})
    unmount()
    expect(vi.getTimerCount()).toBe(0)
    await act(async () => pending.reject(new Error('late failure')))
  })

  it('兼容应用的 StrictMode，加载完成后清理计时器', async () => {
    vi.useFakeTimers()
    const load = () => Promise.resolve('正文')
    const { result } = renderHook(() => useAsyncContent(load), { wrapper: StrictMode })
    await act(async () => {})
    expect(result.current).toMatchObject({ loading: false, data: '正文', error: null })
    expect(vi.getTimerCount()).toBe(0)
  })
})
