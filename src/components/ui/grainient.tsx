'use client'

import React, { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'

export interface GrainientProps {
  /**
   * Color 1 (Hex) - Primary golden yellow (default #f59e0b)
   */
  color1?: string
  /**
   * Color 2 (Hex) - Deep golden orange (default #d97706)
   */
  color2?: string
  /**
   * Color 3 (Hex) - Bright luminous warm yellow (default #fde047)
   */
  color3?: string
  /**
   * Color 4 (Hex) - Rich amber tangerine (default #ea580c)
   */
  color4?: string
  /**
   * Animation speed multiplier (default 1.0)
   */
  speed?: number
  /**
   * Domain warp strength (default 1.0)
   */
  warpStrength?: number
  /**
   * Film grain amount (default 0.075)
   */
  grainAmount?: number
  /**
   * Scale factor for the gradient wave patterns (default 1.0)
   */
  scale?: number
  /**
   * Enable cursor interaction (stirs gradient like fluid paint)
   */
  interactive?: boolean
  className?: string
  style?: React.CSSProperties
}

const VERT_SHADER = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG_SHADER = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec2 uPointer;
uniform float uSpeed;
uniform float uScale;
uniform float uGrain;
uniform float uWarp;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 3; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + vec2(100.0);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 0.001);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) / max(uScale, 0.001);

  float t = uTime * uSpeed * 0.22;

  // Gentle pointer shift
  vec2 pointerOffset = (uPointer - 0.5) * vec2(aspect, 1.0) * 0.35;
  p += pointerOffset;

  // Multi-octave domain warping (flowing fluid motion)
  vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t), fbm(p + vec2(5.2, 1.3) + t * 0.85));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + t * 0.45), fbm(p + 3.5 * q + vec2(8.3, 2.8) + t * 0.38));
  float f = fbm(p + 3.5 * r * uWarp);

  // 4-stop vibrant yellow-orange blend
  vec3 col = mix(uColor1, uColor2, clamp(f * f * 3.8, 0.0, 1.0));
  col = mix(col, uColor3, clamp(length(q), 0.0, 1.0));
  col = mix(col, uColor4, clamp(length(r.x) * 1.1, 0.0, 1.0));

  // Procedural film grain overlay
  vec2 grainCoord = gl_FragCoord.xy;
  float grainNoise = (hash(grainCoord + fract(uTime * 8.0)) - 0.5) * uGrain;
  col += grainNoise;

  // Ultra-smooth edge feathering at top and bottom boundaries directly on GPU
  float topFade = smoothstep(1.0, 0.65, vUv.y);
  float bottomFade = smoothstep(0.0, 0.35, vUv.y);
  float alpha = topFade * bottomFade;

  fragColor = vec4(clamp(col, 0.0, 1.0), alpha);
}
`

export function Grainient({
  className = '',
  color1 = '#fef08a', // Soft luminous warm gold
  color2 = '#fde68a', // Delicate warm gold champagne
  color3 = '#fffbeb', // Luminous warm ivory glow
  color4 = '#fef9c3', // Light honey cream
  grainAmount = 0.05,
  interactive = true,
  scale = 1.0,
  speed = 0.65,
  style,
  warpStrength = 1.0,
}: GrainientProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    let renderer: Renderer | null = null
    let animationFrameId: number | null = null

    try {
      renderer = new Renderer({
        alpha: true,
        antialias: false,
        depth: false,
        dpr: 1.0, // Fixed at 1.0 to eliminate GPU fillrate bottlenecks during scroll
        powerPreference: 'high-performance',
      })
    } catch {
      return
    }

    const gl = renderer.gl
    gl.clearColor(0.0, 0.0, 0.0, 0.0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    container.appendChild(gl.canvas)

    const geometry = new Triangle(gl)

    const c1 = new Color(color1)
    const c2 = new Color(color2)
    const c3 = new Color(color3)
    const c4 = new Color(color4)

    const targetPointer = [0.5, 0.5]
    const currentPointer = [0.5, 0.5]

    const program = new Program(gl, {
      fragment: FRAG_SHADER,
      uniforms: {
        uColor1: { value: [c1.r, c1.g, c1.b] },
        uColor2: { value: [c2.r, c2.g, c2.b] },
        uColor3: { value: [c3.r, c3.g, c3.b] },
        uColor4: { value: [c4.r, c4.g, c4.b] },
        uGrain: { value: grainAmount },
        uPointer: { value: currentPointer },
        uResolution: { value: [container.clientWidth, container.clientHeight] },
        uScale: { value: scale },
        uSpeed: { value: prefersReducedMotion ? 0.0 : speed },
        uTime: { value: 0 },
        uWarp: { value: warpStrength },
      },
      vertex: VERT_SHADER,
    })

    const mesh = new Mesh(gl, { geometry, program })

    let cachedRect: DOMRect | null = null
    function updateRect() {
      if (!container) return
      cachedRect = container.getBoundingClientRect()
    }

    function handleResize() {
      if (!container || !renderer) return
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [width, height]
      updateRect()
    }

    handleResize()

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    const interactiveTarget = container.parentElement || container

    function handlePointerMove(event: PointerEvent) {
      if (!interactive) return
      if (!cachedRect) updateRect()
      if (!cachedRect || cachedRect.width === 0 || cachedRect.height === 0) return
      const x = (event.clientX - cachedRect.left) / cachedRect.width
      const y = 1.0 - (event.clientY - cachedRect.top) / cachedRect.height
      targetPointer[0] = Math.max(0, Math.min(1, x))
      targetPointer[1] = Math.max(0, Math.min(1, y))
    }

    if (interactive) {
      interactiveTarget.addEventListener('pointermove', handlePointerMove as EventListener, {
        passive: true,
      })
    }

    let lastTime = performance.now()
    let elapsed = 0
    let isVisible = false

    function animate(currentTime: number) {
      if (!isVisible) {
        animationFrameId = null
        return
      }

      animationFrameId = requestAnimationFrame(animate)

      const delta = (currentTime - lastTime) * 0.001
      lastTime = currentTime

      if (!prefersReducedMotion) {
        elapsed += delta
        program.uniforms.uTime.value = elapsed

        // Smooth pointer interpolation
        currentPointer[0] += (targetPointer[0] - currentPointer[0]) * 0.06
        currentPointer[1] += (targetPointer[1] - currentPointer[1]) * 0.06
        program.uniforms.uPointer.value = currentPointer
      }

      renderer?.render({ scene: mesh })
    }

    // IntersectionObserver: only run the animation loop when section is visible in viewport!
    // This frees 100% of GPU cycles when the user is scrolling the job list above or footer below.
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isVisible = entry ? entry.isIntersecting : false
        if (isVisible) {
          updateRect()
          lastTime = performance.now()
          if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate)
          }
        } else if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
      },
      { rootMargin: '100px 0px' },
    )

    intersectionObserver.observe(container)

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      if (interactive) {
        interactiveTarget.removeEventListener('pointermove', handlePointerMove as EventListener)
      }
      if (gl.canvas.parentElement) {
        gl.canvas.parentElement.removeChild(gl.canvas)
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [
    color1,
    color2,
    color3,
    color4,
    grainAmount,
    interactive,
    scale,
    speed,
    warpStrength,
  ])

  return (
    <div
      aria-hidden="true"
      className={`grainient-container ${className}`.trim()}
      ref={containerRef}
      style={{
        height: '100%',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        zIndex: 0,
        ...style,
      }}
    />
  )
}

