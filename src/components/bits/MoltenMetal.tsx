/**
 * Shader adapted from React Bits Molten Metal (MIT + Commons Clause).
 * https://github.com/DavidHDev/react-bits/tree/main/src/ts-default/Backgrounds/MoltenMetal
 * Local runtime: one 24fps loop, capped pixels, static mobile/reduced-motion fallback,
 * visibility/scroll suspension and complete resource disposal. No pointer tracking.
 */
import { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Triangle } from 'ogl'

const vertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uScale;
uniform float uDetail;
uniform float uGlow;
uniform float uCoreSize;
uniform float uSwirl;
uniform float uFold;
uniform float uBlackPoint;
uniform float uBrightness;
uniform float uColorMode;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uMouseStrength;
uniform bool uEnableMouse;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uBackgroundColor;
uniform bool uLightMode;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float time = iTime * uSpeed;
  vec2 p = uScale * ((gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y) - 0.5;

  vec2 drift = vec2(0.0);
  if (uEnableMouse) {
    drift = (uMouse - 0.5) * uMouseStrength * 2.0;
  }
  p += drift;

  vec2 i = p;
  float c = 0.0;
  float r = length(p + vec2(sin(time), sin(time * 0.3 + 5.0)) * 0.5);
  float d = length(p);
  float rot = d + time + p.x * uSwirl;

  float cosRot = cos(rot);
  mat2 warp = mat2(cos(rot - sin(time / 5.0)), sin(rot), -sin(cosRot - time), cosRot) * uFold;
  float glowCore = uGlow * uCoreSize;

  for (float n = 0.0; n < 8.0; n++) {
    if (n >= uDetail) break;
    p *= warp;
    float t = r - time / (n + 3.0);
    i -= p + vec2(cos(t - i.x - r) + sin(t + i.y), sin(t - i.y) + cos(t + i.x) + r);
    c += glowCore / length(vec2(sin(i.x + t), cos(i.y + t)));
  }

  c /= 6.0;

  float intensity = max(c - uBlackPoint, 0.0) * uBrightness;

  float g = clamp(intensity, 0.0, 1.0);

  float mid = 0.5;
  if (uColorMode > 1.5) {
    mid = 0.65;
  } else if (uColorMode > 0.5) {
    mid = 0.35;
  }

  vec3 col = mix(uColor1, uColor2, smoothstep(0.0, mid, g));
  col = mix(col, uColor3, smoothstep(mid, 1.0, g));

  float a = g;
  if (uGrain > 0.5) {
    float gr = hash(gl_FragCoord.xy + iTime);
    a += (gr - 0.5) * uGrainIntensity;
  }
  a = clamp(a, 0.0, 1.0) * uOpacity;
  if (uLightMode) {
    float signal = 1.0 - exp(-max(c, 0.0) * 6.5);
    float body = smoothstep(0.075, 0.68, signal);
    float ridge = smoothstep(0.42, 0.92, signal);

    vec3 lightCol = mix(uColor1, uColor2, smoothstep(0.08, 0.52, signal));
    lightCol = mix(lightCol, uColor3, smoothstep(0.52, 0.96, signal));
    lightCol = mix(lightCol, lightCol * 0.72, ridge * 0.24);

    float coverage = body * mix(0.2, 0.86, signal) * uOpacity;
    if (uGrain > 0.5) {
      float gr = hash(gl_FragCoord.xy + iTime);
      coverage += (gr - 0.5) * uGrainIntensity * body * 0.16;
    }
    fragColor = vec4(mix(uBackgroundColor, lightCol, clamp(coverage, 0.0, 0.92)), 1.0);
  } else {
    fragColor = vec4(col * a, a);
  }
}
`;


export default function MoltenMetal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const canvas = document.createElement('canvas')
    // Probe the actual canvas, then reuse its context (no spare WebGL contexts).
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false })
    if (!gl) return

    let dispose = () => gl.getExtension('WEBGL_lose_context')?.loseContext()
    try {
      const renderer = new Renderer({ canvas, webgl: 2, alpha: true, premultipliedAlpha: true, antialias: false, dpr: 1 })
      const geometry = new Triangle(renderer.gl)
      const program = new Program(renderer.gl, {
        vertex, fragment,
        uniforms: {
          iResolution: { value: new Float32Array([1, 1]) },
          iTime: { value: 8 },
          uSpeed: { value: 0.18 },
          uScale: { value: 4 },
          uDetail: { value: 3 },
          uGlow: { value: 1.5 },
          uCoreSize: { value: 0.1 },
          uSwirl: { value: 1 },
          uFold: { value: -0.2 },
          uBlackPoint: { value: 0.06 },
          uBrightness: { value: 1.2 },
          uColorMode: { value: 0 },
          uGrain: { value: 0 },
          uGrainIntensity: { value: 0 },
          uOpacity: { value: 0.68 },
          uMouse: { value: new Float32Array([0.5, 0.5]) },
          uMouseStrength: { value: 0 },
          uEnableMouse: { value: false },
          uColor1: { value: new Float32Array([0.12, 0.12, 0.42]) },
          uColor2: { value: new Float32Array([0.23, 0.65, 0.85]) },
          uColor3: { value: new Float32Array([0.72, 0.65, 1]) },
          uBackgroundColor: { value: new Float32Array([0.02, 0.03, 0.06]) },
          uLightMode: { value: false },
        },
      })
      const mesh = new Mesh(renderer.gl, { geometry, program })
      let raf = 0
      let timer = 0
      let scrollTimer = 0
      let disposed = false
      let contextLost = false
      let scrolling = false
      let lastFrame = performance.now()
      const stop = () => {
        cancelAnimationFrame(raf)
        clearTimeout(timer)
        raf = 0
        timer = 0
      }
      const canRender = () => !disposed && !contextLost && !document.hidden && !scrolling
      const draw = () => {
        raf = 0
        if (!canRender()) return
        const now = performance.now()
        // Resume without a time jump after tab hiding or scrolling.
        program.uniforms.iTime.value += Math.min(now - lastFrame, 100) / 1000
        lastFrame = now
        renderer.render({ scene: mesh })
        timer = window.setTimeout(() => {
          timer = 0
          if (canRender()) raf = requestAnimationFrame(draw)
        }, 1000 / 24)
      }
      const start = () => {
        if (canRender() && !raf && !timer) {
          lastFrame = performance.now()
          raf = requestAnimationFrame(draw)
        }
      }
      const resize = () => {
        if (disposed || contextLost) return
        const { width, height } = container.getBoundingClientRect()
        // At most 400k pixels, half CSS resolution, independent of display DPR.
        const scale = Math.min(0.5, Math.sqrt(400000 / Math.max(1, width * height)))
        renderer.setSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)))
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        const res = program.uniforms.iResolution.value as Float32Array
        res[0] = gl.drawingBufferWidth
        res[1] = gl.drawingBufferHeight
        // The animation loop paints; no separate renders from ResizeObserver.
      }
      const onVisibility = () => document.hidden ? stop() : start()
      const onScroll = () => {
        scrolling = true
        stop()
        clearTimeout(scrollTimer)
        scrollTimer = window.setTimeout(() => {
          scrolling = false
          start()
        }, 180)
      }
      const onContextLost = () => {
        contextLost = true
        stop()
        // Keep the CSS background visible; don't attempt to draw a lost context.
        canvas.style.opacity = '0'
      }
      const ro = new ResizeObserver(resize)
      dispose = () => {
        disposed = true
        stop()
        clearTimeout(scrollTimer)
        ro.disconnect()
        document.removeEventListener('visibilitychange', onVisibility)
        window.removeEventListener('scroll', onScroll)
        canvas.removeEventListener('webglcontextlost', onContextLost)
        canvas.remove()
        geometry.remove()
        gl.deleteProgram(program.program)
        gl.getExtension('WEBGL_lose_context')?.loseContext()
      }
      container.appendChild(canvas)
      ro.observe(container)
      document.addEventListener('visibilitychange', onVisibility)
      window.addEventListener('scroll', onScroll, { passive: true })
      canvas.addEventListener('webglcontextlost', onContextLost)
      resize()
      start()
    } catch {
      dispose()
      // Unsupported or failed graphics initialization leaves the CSS fallback.
      return
    }
    return () => dispose()
  }, [])

  return <div className="site-metal" ref={ref} />
}
