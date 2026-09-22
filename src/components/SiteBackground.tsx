import { Component, Suspense, lazy, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

// 三层背景都拆成异步 chunk：首屏先出文字，氛围层随后接管。
const Plasma = lazy(() => import('./bits/Plasma'))
const LetterGlitch = lazy(() => import('./bits/LetterGlitch'))
const Starfield = lazy(() => import('./bits/Starfield'))

/**
 * 全站统一背景（固定在视口、跨路由常驻），三层叠加：
 *
 * 1. Plasma（ogl / WebGL）：紫青色流动等离子，负责"会不会动"；
 * 2. Starfield（canvas 2D）：缓慢漂移的星点，负责空间纵深感；
 * 3. LetterGlitch（canvas 2D）：极低透明度的字符乱码矩阵，负责"数字质感"。
 *
 * 挂在 MainLayout 上而不是首页：React Router 切换路由时 MainLayout 不会卸载，
 * 所以 canvas 只初始化一次，文档页也能共享同一片背景，来回切页不会闪。
 *
 * ogl 在无 WebGL 的环境（老机器、禁用硬件加速、无头浏览器）会在初始化阶段抛错，
 * 直接渲染会把整棵 React 树带崩成白屏。所以这里先探测 WebGL，再给每层套错误边界，
 * 失败情况退回纯 CSS 光晕（星空/乱码是 canvas 2D，即使 WebGL 不可用也能跑，
 * 但探测不通过时一并走 CSS 兜底，省两个动画循环）。
 *
 * 性能：Plasma 是 raymarch 着色器，比较吃 GPU，因此降了渲染分辨率（renderScale）、
 * 帧率上限（targetFps）与迭代次数（iterations）。Starfield 与 LetterGlitch 都是
 * canvas 2D，各自钳了 30fps，三层总开销仍然可控。各组件内部已自带
 * prefers-reduced-motion 判断与「页面不可见时暂停」逻辑。
 */
function supportsWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

class BackgroundBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[SiteBackground] 背景层初始化失败，已降级：', error, info)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export default function SiteBackground() {
  const [enabled] = useState(supportsWebGL)

  if (!enabled) return <div className="site-bg site-bg--fallback" aria-hidden="true" />

  return (
    <div className="site-bg" aria-hidden="true">
      <BackgroundBoundary fallback={<div className="site-bg-fallback" />}>
        <Suspense fallback={<div className="site-bg-fallback" />}>
          <Plasma
            color="#7c4dff"
            speed={0.5}
            scale={0.7}
            opacity={0.82}
            // 背景层是 pointer-events: none（否则会挡住上方卡片的点击），
            // 所以鼠标视差收不到事件，直接关掉更省一次 rAF 里的坐标计算。
            mouseInteractive={false}
            renderScale={0.5}
            targetFps={30}
            iterations={48}
          />
        </Suspense>
      </BackgroundBoundary>

      {/* 星空层：压在等离子之上、乱码矩阵之下，负责空间纵深。
          canvas 2D、星点上限 220、30fps，是最便宜的一层动画。 */}
      <BackgroundBoundary fallback={null}>
        <Suspense fallback={null}>
          <Starfield />
        </Suspense>
      </BackgroundBoundary>

      <BackgroundBoundary fallback={null}>
        <Suspense fallback={null}>
          <div className="site-glitch">
            <LetterGlitch
              glitchColors={['#150b2e', '#4c1d95', '#0e5f75']}
              glitchSpeed={110}
              centerVignette={false}
              outerVignette={false}
              smooth
              lightMode={false}
              // 默认会铺一层不透明黑底（inline style），必须显式透明才能叠在 Plasma 上
              backgroundColor="transparent"
              characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\|=+*#@$%&"
            />
          </div>
        </Suspense>
      </BackgroundBoundary>

      {/* CRT 扫描线：纯 CSS、零 JS，压在最顶层做一层"复古终端"质感。
          reduced-motion 下 ::after 的扫掠光带会被 global.css 里的降级关掉。 */}
      <div className="site-scanlines" />
    </div>
  )
}
