import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/**
 * 读取系统的「减少动态效果」偏好，并跟随其变化。
 *
 * Plasma / CountUp 等第三方组件内部各自判断了这个媒体查询，
 * 而 DecryptedText 没有，所以由调用方用这个 hook 决定是否降级。
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia?.(QUERY).matches ?? false
  })

  useEffect(() => {
    const mql = window.matchMedia?.(QUERY)
    if (!mql) return

    const onChange = () => setReduced(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return reduced
}
