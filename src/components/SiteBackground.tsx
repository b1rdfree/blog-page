import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const MoltenMetal = lazy(() => import('./bits/MoltenMetal'))
const STATIC_QUERY = '(prefers-reduced-motion: reduce), (max-width: 900px), (pointer: coarse)'

class BackgroundBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

/** One persistent background. CSS paints immediately; GPU work waits for load + idle. */
export default function SiteBackground({ theme }: { theme: 'light' | 'dark' }) {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const preference = window.matchMedia(STATIC_QUERY)
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection
    let cancelled = false
    let idle = 0
    let timer = 0
    const cancel = () => {
      if (idle) window.cancelIdleCallback?.(idle)
      clearTimeout(timer)
      idle = 0
      timer = 0
    }
    const schedule = () => {
      cancel()
      if (cancelled) return
      if (theme === 'light' || preference.matches || connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? '')) {
        setEnabled(false)
        return
      }
      if (document.readyState !== 'complete' || document.hidden) return
      // Never compete with initial content/resources. No idle timeout forcing work.
      timer = window.setTimeout(() => {
        const enable = () => {
          if (!cancelled && !document.hidden && !preference.matches) setEnabled(true)
        }
        if ('requestIdleCallback' in window) idle = window.requestIdleCallback(enable)
        else enable()
      }, 1200)
    }
    schedule()
    window.addEventListener('load', schedule)
    document.addEventListener('visibilitychange', schedule)
    preference.addEventListener('change', schedule)
    return () => {
      cancelled = true
      cancel()
      window.removeEventListener('load', schedule)
      document.removeEventListener('visibilitychange', schedule)
      preference.removeEventListener('change', schedule)
    }
  }, [theme])

  return (
    <div className="site-bg" aria-hidden="true">
      {theme === 'dark' && enabled && <BackgroundBoundary><Suspense fallback={null}><MoltenMetal /></Suspense></BackgroundBoundary>}
      <div className="site-grid" />
    </div>
  )
}
