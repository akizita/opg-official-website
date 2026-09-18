'use client'

import { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'

const MAX_STOPS = 6

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[${MAX_STOPS}];
uniform int uNumStops;
uniform vec2 uResolution;
uniform float uBlend;
uniform float uLightMode;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
      0.211324865405187, 0.366025403784439,
      -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
      0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
      ), 
      0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 calculateRampColor(vec2 uv) {
  if (uNumStops <= 1) {
    return uColorStops[0];
  }
  float nStops = float(uNumStops);
  float stepSize = 1.0 / (nStops - 1.0);
  
  if (uv.x <= 0.0) {
    return uColorStops[0];
  }
  
  vec3 rampColor = uColorStops[0];
  for (int i = 0; i < ${MAX_STOPS - 1}; i++) {
    if (i < uNumStops - 1) {
      float pos0 = float(i) * stepSize;
      float pos1 = float(i + 1) * stepSize;
      if (uv.x >= pos0 && uv.x <= pos1) {
        float t = (uv.x - pos0) / (pos1 - pos0);
        rampColor = mix(uColorStops[i], uColorStops[i + 1], t);
        return rampColor;
      }
    }
  }
  
  for (int i = 0; i < ${MAX_STOPS}; i++) {
    if (i == uNumStops - 1) {
      rampColor = uColorStops[i];
    }
  }
  return rampColor;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  vec3 rampColor = calculateRampColor(uv);
  
  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;
  
  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);
  
  vec3 auroraColor = intensity * rampColor;
  
  if (uLightMode > 0.5) {
    float energy = clamp(max(intensity, 0.0), 0.0, 1.0);
    float coverage = clamp(auroraAlpha * (0.55 + 0.45 * energy), 0.0, 0.86);
    vec3 chroma = pow(clamp(rampColor, 0.0, 1.0), vec3(1.2));
    float chromaPeak = max(chroma.r, max(chroma.g, chroma.b));
    chroma /= max(chromaPeak, 0.0001);
    fragColor = vec4(mix(vec3(1.0), chroma, min(coverage * 1.08, 0.94)), 1.0);
  } else {
    fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
  }
}
`

export interface AuroraProps {
  /**
   * Array of 2 to 6 hex color stops for the gradient wash.
   * Defaults to a multi-color spectrum coordinated with OPG Golden Orange & Golden Yellow.
   */
  colorStops?: string[]
  /**
   * Wave amplitude height (0.6 - 0.8 recommended for calm, premium motion).
   */
  amplitude?: number
  /**
   * Blend threshold width (0.25 - 0.4 recommended for light theme).
   */
  blend?: number
  /**
   * Animation speed multiplier (0.15 - 0.3 recommended for subtle motion).
   */
  speed?: number
  /**
   * Explicit time override if manually driving animation.
   */
  time?: number
  /**
   * Light mode shader optimization (fades to white base instead of black edges).
   */
  lightMode?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Multi-shade yellow to yellow-orange Aurora palette:
 * - #ea580c: Deep Tangerine Orange (rich contour & contrast)
 * - #f29f04: OPG Golden Orange (official brand primary)
 * - #f2b705: OPG Golden Yellow (official brand secondary)
 * - #ffd000: Radiant Bright Gold (vibrant luminous wave crests)
 * - #f59e0b: Warm Amber Honey (rich transition tone)
 */
export const DEFAULT_AURORA_PALETTE = [
  '#ea580c',
  '#f29f04',
  '#f2b705',
  '#ffd000',
  '#f59e0b',
]

function populateColorBuffer(stops: string[]): Float32Array {
  const buffer = new Float32Array(MAX_STOPS * 3)
  for (let i = 0; i < MAX_STOPS; i++) {
    if (i < stops.length) {
      const c = new Color(stops[i])
      buffer[i * 3 + 0] = c.r
      buffer[i * 3 + 1] = c.g
      buffer[i * 3 + 2] = c.b
    } else if (stops.length > 0) {
      const last = new Color(stops[stops.length - 1])
      buffer[i * 3 + 0] = last.r
      buffer[i * 3 + 1] = last.g
      buffer[i * 3 + 2] = last.b
    }
  }
  return buffer
}

export function Aurora({
  colorStops = DEFAULT_AURORA_PALETTE,
  amplitude = 0.75,
  blend = 0.35,
  speed = 0.22,
  time,
  lightMode = true,
  className = '',
  style,
}: AuroraProps) {
  const propsRef = useRef({
    colorStops,
    amplitude,
    blend,
    speed,
    time,
    lightMode,
  })

  useEffect(() => {
    propsRef.current = { colorStops, amplitude, blend, speed, time, lightMode }
  }, [colorStops, amplitude, blend, speed, time, lightMode])

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: Renderer | null = null
    let program: Program | null = null
    let animateId = 0

    // Check for prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let isReducedMotion = mediaQuery.matches

    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })
    } catch {
      // Graceful fallback if WebGL is unavailable
      return
    }

    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    const canvas = gl.canvas as HTMLCanvasElement
    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.display = 'block'
    // Multiply blend mode smoothly embeds colors into the light background
    canvas.style.mixBlendMode = 'multiply'
    canvas.style.opacity = '0.92'
    canvas.style.pointerEvents = 'none'

    function resize() {
      if (!container || !renderer) return
      const width = container.offsetWidth || window.innerWidth
      const height = container.offsetHeight || window.innerHeight
      renderer.setSize(width, height)
      if (program) {
        program.uniforms.uResolution.value = [width, height]
      }
    }

    window.addEventListener('resize', resize)

    const geometry = new Triangle(gl)
    if (geometry.attributes.uv) {
      delete geometry.attributes.uv
    }

    const effectiveStops =
      colorStops.length > 0 ? colorStops : DEFAULT_AURORA_PALETTE
    const initialNumStops = Math.min(
      Math.max(effectiveStops.length, 2),
      MAX_STOPS,
    )
    const initialColorBuffer = populateColorBuffer(effectiveStops)

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: initialColorBuffer },
        uNumStops: { value: initialNumStops },
        uResolution: {
          value: [
            container.offsetWidth || window.innerWidth,
            container.offsetHeight || window.innerHeight,
          ],
        },
        uBlend: { value: blend },
        uLightMode: { value: lightMode ? 1 : 0 },
      },
    })

    const mesh = new Mesh(gl, { geometry, program })
    container.appendChild(canvas)

    const renderSingleFrame = (t: number) => {
      if (!program || !renderer) return
      const currentProps = propsRef.current
      const stops =
        currentProps.colorStops && currentProps.colorStops.length > 0
          ? currentProps.colorStops
          : DEFAULT_AURORA_PALETTE

      program.uniforms.uTime.value = t
      program.uniforms.uAmplitude.value = currentProps.amplitude
      program.uniforms.uBlend.value = currentProps.blend
      program.uniforms.uLightMode.value = currentProps.lightMode ? 1 : 0
      program.uniforms.uNumStops.value = Math.min(
        Math.max(stops.length, 2),
        MAX_STOPS,
      )
      program.uniforms.uColorStops.value = populateColorBuffer(stops)
      renderer.render({ scene: mesh })
    }

    const update = (timestamp: number) => {
      if (isReducedMotion) {
        renderSingleFrame(1.2)
        return
      }

      animateId = requestAnimationFrame(update)
      const currentProps = propsRef.current
      const t = currentProps.time ?? timestamp * 0.001
      renderSingleFrame(t * currentProps.speed * 0.4)
    }

    const onMotionChange = (event: MediaQueryListEvent) => {
      isReducedMotion = event.matches
      if (!isReducedMotion) {
        animateId = requestAnimationFrame(update)
      } else {
        cancelAnimationFrame(animateId)
        renderSingleFrame(1.2)
      }
    }

    mediaQuery.addEventListener('change', onMotionChange)

    resize()
    animateId = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(animateId)
      window.removeEventListener('resize', resize)
      mediaQuery.removeEventListener('change', onMotionChange)
      if (canvas.parentNode === container) {
        container.removeChild(canvas)
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [amplitude, blend, colorStops, lightMode])

  return (
    <div
      aria-hidden="true"
      className={`aurora-wrapper ${className}`}
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        ...style,
      }}
    />
  )
}

export default Aurora
