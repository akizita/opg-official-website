'use client'

import React, { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'

const MAX_COLORS = 8

const VERT_SHADER = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG_SHADER = `
precision highp float;

uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform vec3 uColor6;
uniform vec3 uColor7;
uniform int uTransparent;
uniform float uScale;
uniform float uFrequency;
uniform float uWarpStrength;
uniform vec2 uPointer;
uniform float uMouseInfluence;
uniform float uParallax;
uniform float uNoise;
uniform int uIterations;
uniform float uIntensity;
uniform float uBandWidth;

varying vec2 vUv;

vec3 getColor(int idx) {
  if (idx == 0) return uColor0;
  if (idx == 1) return uColor1;
  if (idx == 2) return uColor2;
  if (idx == 3) return uColor3;
  if (idx == 4) return uColor4;
  if (idx == 5) return uColor5;
  if (idx == 6) return uColor6;
  return uColor7;
}

void main() {
  float t = uTime * uSpeed;
  vec2 p = vUv * 2.0 - 1.0;
  p += uPointer * uParallax * 0.1;
  vec2 rp = vec2(p.x * uRot.x - p.y * uRot.y, p.x * uRot.y + p.y * uRot.x);
  vec2 q = vec2(rp.x * (uCanvas.x / max(uCanvas.y, 0.001)), rp.y);
  q /= max(uScale, 0.0001);
  q /= 0.5 + 0.2 * dot(q, q);
  q += 0.2 * cos(t) - 7.56;
  vec2 toward = (uPointer - rp);
  q += toward * uMouseInfluence * 0.2;

  for (int j = 0; j < 5; j++) {
    if (j >= uIterations - 1) break;
    vec2 rr = sin(1.5 * (q.yx * uFrequency) + 2.0 * cos(q * uFrequency));
    q += (rr - q) * 0.15;
  }

  vec3 col = vec3(0.0);
  float a = 1.0;

  if (uColorCount > 0) {
    vec2 s = q;
    vec3 sumCol = vec3(0.0);
    float cover = 0.0;
    for (int i = 0; i < 8; ++i) {
      if (i >= uColorCount) break;
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(i)) / 4.0);
      float m = mix(m0, m1, kMix);
      float w = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
      sumCol += getColor(i) * w;
      cover = max(cover, w);
    }
    sumCol *= uIntensity;
    float maxCh = max(sumCol.r, max(sumCol.g, sumCol.b));
    if (maxCh > 1.0) {
      sumCol /= maxCh;
    }
    col = sumCol;
    a = (uTransparent > 0) ? min(cover * min(uIntensity, 1.5), 1.0) : 1.0;
  }

  if (uNoise > 0.0001) {
    float n = fract(sin(dot(gl_FragCoord.xy + vec2(uTime), vec2(12.9898, 78.233))) * 43758.5453123);
    col += (n - 0.5) * uNoise;
    col = clamp(col, 0.0, 1.0);
  }

  vec3 rgb = (uTransparent > 0) ? col * a : col;
  gl_FragColor = vec4(rgb, a);
}
`

export interface ColorBendsProps extends React.HTMLAttributes<HTMLDivElement> {
  rotation?: number
  speed?: number
  colors?: string[]
  transparent?: boolean
  autoRotate?: number
  scale?: number
  frequency?: number
  warpStrength?: number
  mouseInfluence?: number
  parallax?: number
  noise?: number
  iterations?: number
  intensity?: number
  bandWidth?: number
}

export function ColorBends({
  className = '',
  style,
  rotation = 45,
  speed = 0.25,
  colors = ['#f29f04', '#fbbf24', '#f59e0b', '#d97706', '#ea580c'],
  transparent = true,
  autoRotate = 2,
  scale = 1.2,
  frequency = 1.0,
  warpStrength = 1.25,
  mouseInfluence = 0.5,
  parallax = 0.3,
  noise = 0.04,
  iterations = 2,
  intensity = 1.65,
  bandWidth = 2.4,
  ...rest
}: ColorBendsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number | null>(null)

  const propsRef = useRef({
    rotation,
    speed,
    colors,
    transparent,
    autoRotate,
    scale,
    frequency,
    warpStrength,
    mouseInfluence,
    parallax,
    noise,
    iterations,
    intensity,
    bandWidth,
  })

  useEffect(() => {
    propsRef.current = {
      rotation,
      speed,
      colors,
      transparent,
      autoRotate,
      scale,
      frequency,
      warpStrength,
      mouseInfluence,
      parallax,
      noise,
      iterations,
      intensity,
      bandWidth,
    }
  }, [
    rotation,
    speed,
    colors,
    transparent,
    autoRotate,
    scale,
    frequency,
    warpStrength,
    mouseInfluence,
    parallax,
    noise,
    iterations,
    intensity,
    bandWidth,
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: Renderer | null = null
    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        depth: false,
        dpr: 1.0,
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    const gl = renderer.gl
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const validColors = propsRef.current.colors.slice(0, MAX_COLORS)
    const colorValues: [number, number, number][] = []
    for (let i = 0; i < MAX_COLORS; i++) {
      if (i < validColors.length) {
        const c = new Color(validColors[i])
        colorValues.push([c.r, c.g, c.b])
      } else {
        colorValues.push([0, 0, 0])
      }
    }

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: VERT_SHADER,
      fragment: FRAG_SHADER,
      uniforms: {
        uCanvas: {
          value: [
            container.clientWidth || 300,
            container.clientHeight || 150,
          ],
        },
        uTime: { value: 0 },
        uSpeed: { value: propsRef.current.speed },
        uRot: { value: [1, 0] },
        uColorCount: { value: validColors.length },
        uColor0: { value: colorValues[0] },
        uColor1: { value: colorValues[1] },
        uColor2: { value: colorValues[2] },
        uColor3: { value: colorValues[3] },
        uColor4: { value: colorValues[4] },
        uColor5: { value: colorValues[5] },
        uColor6: { value: colorValues[6] },
        uColor7: { value: colorValues[7] },
        uTransparent: { value: propsRef.current.transparent ? 1 : 0 },
        uScale: { value: propsRef.current.scale },
        uFrequency: { value: propsRef.current.frequency },
        uWarpStrength: { value: propsRef.current.warpStrength },
        uPointer: { value: [0, 0] },
        uMouseInfluence: { value: propsRef.current.mouseInfluence },
        uParallax: { value: propsRef.current.parallax },
        uNoise: { value: propsRef.current.noise },
        uIterations: { value: propsRef.current.iterations },
        uIntensity: { value: propsRef.current.intensity },
        uBandWidth: { value: propsRef.current.bandWidth },
      },
    })

    const mesh = new Mesh(gl, { geometry, program })

    gl.canvas.style.position = 'absolute'
    gl.canvas.style.inset = '0'
    gl.canvas.style.width = '100%'
    gl.canvas.style.height = '100%'
    gl.canvas.style.display = 'block'
    gl.canvas.style.pointerEvents = 'none'
    container.appendChild(gl.canvas)

    const targetEl =
      (container.parentElement as HTMLElement | null) || container

    const handleResize = () => {
      if (!container || !renderer) return
      const w = container.clientWidth || targetEl.clientWidth || 300
      const h = container.clientHeight || targetEl.clientHeight || 150
      renderer.setSize(w, h)
      program.uniforms.uCanvas.value[0] = gl.canvas.width
      program.uniforms.uCanvas.value[1] = gl.canvas.height
      try {
        renderer.render({ scene: mesh })
      } catch {
        // Safe fallback
      }
    }

    handleResize()
    requestAnimationFrame(handleResize)

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(container)
      if (targetEl !== container) {
        resizeObserver.observe(targetEl)
      }
    }
    window.addEventListener('resize', handleResize)

    const targetPointer = [0, 0]
    const currentPointer = [0, 0]

    let cachedRect: DOMRect | null = null
    const updateRect = () => {
      cachedRect = targetEl.getBoundingClientRect()
    }
    updateRect()

    const handlePointerMove = (e: PointerEvent) => {
      if (!cachedRect) updateRect()
      if (!cachedRect) return
      const x = ((e.clientX - cachedRect.left) / (cachedRect.width || 1)) * 2 - 1
      const y = -(((e.clientY - cachedRect.top) / (cachedRect.height || 1)) * 2 - 1)
      targetPointer[0] = Math.max(-1, Math.min(1, x))
      targetPointer[1] = Math.max(-1, Math.min(1, y))
    }

    const handlePointerLeave = () => {
      targetPointer[0] = 0
      targetPointer[1] = 0
    }

    targetEl.addEventListener('pointermove', handlePointerMove as EventListener, {
      passive: true,
    })
    targetEl.addEventListener('pointerleave', handlePointerLeave, {
      passive: true,
    })

    const startTime = performance.now()
    let lastTime = startTime

    const renderLoop = (now: number) => {
      animFrameRef.current = requestAnimationFrame(renderLoop)

      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      const elapsed = (now - startTime) / 1000

      const p = propsRef.current
      program.uniforms.uTime.value = elapsed
      program.uniforms.uSpeed.value = p.speed
      program.uniforms.uScale.value = p.scale
      program.uniforms.uFrequency.value = p.frequency
      program.uniforms.uWarpStrength.value = p.warpStrength
      program.uniforms.uMouseInfluence.value = p.mouseInfluence
      program.uniforms.uParallax.value = p.parallax
      program.uniforms.uNoise.value = p.noise
      program.uniforms.uIterations.value = p.iterations
      program.uniforms.uIntensity.value = p.intensity
      program.uniforms.uBandWidth.value = p.bandWidth
      program.uniforms.uColorCount.value = Math.min(p.colors.length, MAX_COLORS)

      for (let i = 0; i < MAX_COLORS; i++) {
        const uKey = `uColor${i}` as keyof typeof program.uniforms
        if (i < p.colors.length) {
          const c = new Color(p.colors[i])
          program.uniforms[uKey].value[0] = c.r
          program.uniforms[uKey].value[1] = c.g
          program.uniforms[uKey].value[2] = c.b
        }
      }

      const deg = (p.rotation % 360) + p.autoRotate * elapsed
      const rad = (deg * Math.PI) / 180
      program.uniforms.uRot.value[0] = Math.cos(rad)
      program.uniforms.uRot.value[1] = Math.sin(rad)

      const amt = Math.min(1, dt * 6)
      currentPointer[0] += (targetPointer[0] - currentPointer[0]) * amt
      currentPointer[1] += (targetPointer[1] - currentPointer[1]) * amt
      program.uniforms.uPointer.value[0] = currentPointer[0]
      program.uniforms.uPointer.value[1] = currentPointer[1]

      try {
        renderer?.render({ scene: mesh })
      } catch {
        // Fallback gracefully without breaking render loop
      }
    }

    // Render initial frame immediately
    try {
      renderer.render({ scene: mesh })
    } catch {
      // Ignore initial render errors
    }

    animFrameRef.current = requestAnimationFrame(renderLoop)

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', handleResize)
      targetEl.removeEventListener(
        'pointermove',
        handlePointerMove as EventListener,
      )
      targetEl.removeEventListener('pointerleave', handlePointerLeave)
      if (gl.canvas && gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`color-bends-wrapper ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
      {...rest}
    />
  )
}
