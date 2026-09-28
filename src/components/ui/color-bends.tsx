'use client'

import React, { useEffect, useRef } from 'react'
import { Renderer, Program, Mesh, Triangle } from 'ogl'

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

#define MAX_COLORS ${MAX_COLORS}
uniform vec2 uCanvas;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uRot;
uniform int uColorCount;
uniform vec3 uColors[MAX_COLORS];
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
    for (int i = 0; i < MAX_COLORS; ++i) {
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
      sumCol += uColors[i] * w;
      cover = max(cover, w);
    }
    col = clamp(sumCol, 0.0, 1.0);
    a = uTransparent > 0 ? cover : 1.0;
  } else {
    vec2 s = q;
    for (int k = 0; k < 3; ++k) {
      s -= 0.01;
      vec2 r = sin(1.5 * (s.yx * uFrequency) + 2.0 * cos(s * uFrequency));
      float m0 = length(r + sin(5.0 * r.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float kBelow = clamp(uWarpStrength, 0.0, 1.0);
      float kMix = pow(kBelow, 0.3);
      float gain = 1.0 + max(uWarpStrength - 1.0, 0.0);
      vec2 disp = (r - s) * kBelow;
      vec2 warped = s + disp * gain;
      float m1 = length(warped + sin(5.0 * warped.y * uFrequency - 3.0 * t + float(k)) / 4.0);
      float m = mix(m0, m1, kMix);
      col[k] = 1.0 - exp(-uBandWidth / exp(uBandWidth * m));
    }
    a = uTransparent > 0 ? max(max(col.r, col.g), col.b) : 1.0;
  }

  col *= uIntensity;

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

function parseHexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) / 255,
      parseInt(clean[1] + clean[1], 16) / 255,
      parseInt(clean[2] + clean[2], 16) / 255,
    ]
  }
  return [
    parseInt(clean.slice(0, 2), 16) / 255,
    parseInt(clean.slice(2, 4), 16) / 255,
    parseInt(clean.slice(4, 6), 16) / 255,
  ]
}

export function ColorBends({
  className = '',
  style,
  rotation = 90,
  speed = 0.22,
  colors = ['#f29f04', '#f2b705', '#c77800', '#221508', '#ffd159'],
  transparent = true,
  autoRotate = 2,
  scale = 1.1,
  frequency = 0.9,
  warpStrength = 1.15,
  mouseInfluence = 0.6,
  parallax = 0.35,
  noise = 0.12,
  iterations = 2,
  intensity = 1.35,
  bandWidth = 5.2,
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
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    const gl = renderer.gl
    gl.clearColor(0, 0, 0, propsRef.current.transparent ? 0 : 1)
    if (propsRef.current.transparent) {
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    }

    const colorsFlattened = new Float32Array(MAX_COLORS * 3)
    const validColors = propsRef.current.colors.slice(0, MAX_COLORS)
    validColors.forEach((hex, i) => {
      const [r, g, b] = parseHexToRgb(hex)
      colorsFlattened[i * 3] = r
      colorsFlattened[i * 3 + 1] = g
      colorsFlattened[i * 3 + 2] = b
    })

    const geometry = new Triangle(gl)
    const program = new Program(gl, {
      vertex: VERT_SHADER,
      fragment: FRAG_SHADER,
      uniforms: {
        uCanvas: { value: new Float32Array([container.clientWidth || 1, container.clientHeight || 1]) },
        uTime: { value: 0 },
        uSpeed: { value: propsRef.current.speed },
        uRot: { value: new Float32Array([1, 0]) },
        uColorCount: { value: validColors.length },
        uColors: { value: colorsFlattened },
        uTransparent: { value: propsRef.current.transparent ? 1 : 0 },
        uScale: { value: propsRef.current.scale },
        uFrequency: { value: propsRef.current.frequency },
        uWarpStrength: { value: propsRef.current.warpStrength },
        uPointer: { value: new Float32Array([0, 0]) },
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

    const MAX_RENDER_DIM = 1920
    const handleResize = () => {
      if (!container || !renderer) return
      const w = container.clientWidth || 1
      const h = container.clientHeight || 1
      const baseDpr = Math.min(window.devicePixelRatio || 1, 2)
      const longest = Math.max(w, h) * baseDpr
      renderer.dpr = longest > MAX_RENDER_DIM ? (baseDpr * MAX_RENDER_DIM) / longest : baseDpr
      renderer.setSize(w, h)
      program.uniforms.uCanvas.value[0] = gl.canvas.width
      program.uniforms.uCanvas.value[1] = gl.canvas.height
    }

    handleResize()

    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(container)
    }
    window.addEventListener('resize', handleResize)

    const targetPointer = [0, 0]
    const currentPointer = [0, 0]

    const handlePointerMove = (e: PointerEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / (rect.width || 1)) * 2 - 1
      const y = -(((e.clientY - rect.top) / (rect.height || 1)) * 2 - 1)
      targetPointer[0] = x
      targetPointer[1] = y
    }

    container.addEventListener('pointermove', handlePointerMove)

    let startTime = performance.now()
    let lastTime = startTime

    const renderLoop = (now: number) => {
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

      const deg = (p.rotation % 360) + p.autoRotate * elapsed
      const rad = (deg * Math.PI) / 180
      program.uniforms.uRot.value[0] = Math.cos(rad)
      program.uniforms.uRot.value[1] = Math.sin(rad)

      const amt = Math.min(1, dt * 6)
      currentPointer[0] += (targetPointer[0] - currentPointer[0]) * amt
      currentPointer[1] += (targetPointer[1] - currentPointer[1]) * amt
      program.uniforms.uPointer.value[0] = currentPointer[0]
      program.uniforms.uPointer.value[1] = currentPointer[1]

      renderer?.render({ scene: mesh })
      animFrameRef.current = requestAnimationFrame(renderLoop)
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
      container.removeEventListener('pointermove', handlePointerMove)
      if (gl.canvas && gl.canvas.parentElement === container) {
        container.removeChild(gl.canvas)
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
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
