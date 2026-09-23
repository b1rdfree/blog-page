/** Adapted from React Bits Spotlight Card (MIT + Commons Clause).
 * https://reactbits.dev/components/spotlight-card
 * Local: frame-coalesced pointer writes; no React updates or idle animation loop.
 */
import { useEffect, useRef } from 'react'
import type { PointerEvent, ReactNode } from 'react'

export default function SpotlightCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const cancel = () => { cancelAnimationFrame(frame.current); frame.current = 0 }
  useEffect(() => cancel, [])
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    cancel()
    const { clientX, clientY } = event
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mouse-x', `${clientX - rect.left}px`)
      el.style.setProperty('--mouse-y', `${clientY - rect.top}px`)
    })
  }
  return <div ref={ref} className={`spotlight-card ${className}`} onPointerMove={move} onPointerLeave={cancel}>{children}</div>
}
