import { useEffect, useState } from 'react'
import { loadTrip } from './dataset'
import type { TripDataset } from './types'

type State = {
  data: TripDataset | null
  loading: boolean
  /** 地址写错了 / 文件被删了 */
  missing: boolean
}

/**
 * 按需加载单份旅行数据集。
 *
 * 用 `ignored` 标记丢弃过期响应：快速连点列表时，先发的请求可能后返回，
 * 不判会把上一篇的内容盖到下一篇上。
 */
export function useTrip(slug: string | undefined): State {
  const [state, setState] = useState<State>({ data: null, loading: true, missing: false })

  useEffect(() => {
    if (!slug) {
      setState({ data: null, loading: false, missing: false })
      return
    }

    let ignored = false
    setState((prev) => ({ data: prev.data, loading: true, missing: false }))

    void loadTrip(slug).then((data) => {
      if (ignored) return
      setState({ data, loading: false, missing: data === null })
    })

    return () => {
      ignored = true
    }
  }, [slug])

  return state
}
