import { useCallback, useEffect, useState } from 'react'

type Loader<T> = () => Promise<T | null>
type Result<T> = {
  loader: Loader<T>
  attempt: number
  data: T | null
  error: 'load' | 'timeout' | null
}

/** 调用方用 useCallback 固定 loader；每次尝试独立计时并丢弃过期响应。 */
export function useAsyncContent<T>(loader: Loader<T> | undefined) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result<T> | null>(null)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    if (!loader) return
    let finished = false
    const finish = (data: T | null, error: Result<T>['error']) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      setResult({ loader, attempt, data, error })
    }
    const timer = setTimeout(() => finish(null, 'timeout'), 15_000)

    void Promise.resolve().then(loader).then(
      (data) => finish(data, null),
      () => finish(null, 'load'),
    )

    return () => {
      // import() 不能取消，但卸载、切换文章或重试后不会再写入旧结果。
      finished = true
      clearTimeout(timer)
    }
  }, [loader, attempt])

  // 渲染时就隔离旧结果，避免 effect 执行前短暂显示上一篇文章。
  const current = loader && result?.loader === loader && result.attempt === attempt ? result : null
  return {
    data: current?.data ?? null,
    loading: Boolean(loader && !current),
    missing: Boolean(current && !current.error && current.data === null),
    error: current?.error ?? null,
    retry,
  }
}
