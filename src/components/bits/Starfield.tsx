import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion'

/**
 * 星空层（canvas 2D，非 WebGL）：
 *
 * 一片缓慢向镜头漂移的星点，做出「太空舱外缓慢航行」的纵深感。
 * 刻意压成本：
 * - 星点数按面积算密度（约每 9000px² 一颗），上限 220 颗；
 * - DPR 钳到 1.5、帧率钳到 30fps，静止帧时不重绘；
 * - 页面不可见即停 rAF；prefers-reduced-motion 时只画一帧静态星空。
 *
 * 与 Plasma / LetterGlitch 的分工：Plasma 负责「流动的等离子体」，
 * LetterGlitch 负责「数字乱码质感」，本组件负责「空间纵深」——
 * 三层叠起来才是完整的太空科幻氛围，单独看都只是一片噪点。
 */
type Star = {
  x: number
  y: number
  z: number // 深度 0~1，越小越远
  size: number
  hue: number // 冷色偏蓝紫，偶尔一点青
}

function createStars(w: number, h: number): Star[] {
  const count = Math.min(220, Math.round((w * h) / 9000))
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.08 + Math.random() * 0.92,
      size: 0.4 + Math.random() * 1.1,
      hue: Math.random() < 0.75 ? 250 + Math.random() * 30 : 190 + Math.random() * 20,
    })
  }
  return stars
}

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduceMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let frame = 0
    let stars: Star[] = []
    let w = 0
    let h = 0
    let resizeTimer = 0

    const drawStatic = () => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        const alpha = 0.16 + s.z * 0.5
        ctx.fillStyle = `hsla(${s.hue}, 70%, 82%, ${alpha})`
        ctx.fillRect(s.x, s.y, s.size, s.size)
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      for (const s of stars) {
        // 缓慢漂向镜头：z 增长，近的星移动稍快形成视差
        s.z += 0.00042
        if (s.z > 1) {
          s.z = 0.08
          s.x = Math.random() * w
          s.y = Math.random() * h
        }
        const twinkle = 0.75 + 0.25 * Math.sin((frame + s.x * 7) * 0.02)
        const alpha = (0.14 + s.z * 0.55) * twinkle
        const size = s.size * (0.6 + s.z * 0.7)
        ctx.fillStyle = `hsla(${s.hue}, 72%, 84%, ${alpha})`
        ctx.fillRect(s.x, s.y, size, size)
      }
    }

    const loop = () => {
      frame++
      draw()
      // 30fps 上限：跳帧节流，省一半的 2D 绘制
      setTimeout(() => {
        raf = requestAnimationFrame(loop)
      }, 33)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stars = createStars(w, h)
      if (reduceMotion) drawStatic()
    }

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
      } else if (!reduceMotion) {
        raf = requestAnimationFrame(loop)
      }
    }

    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(resize, 150)
    }

    resize()
    if (reduceMotion) {
      drawStatic()
    } else {
      raf = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduceMotion])

  return <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />
}