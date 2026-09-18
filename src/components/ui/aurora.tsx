'use client'

import { useEffect, useRef } from 'react'
import { Color, Mesh, Program, Renderer, Triangle } from 'ogl'

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
uniform vec3 uColorStops[3];
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

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                              \\
  for (int i = 0; i < 2; i++) {                               \\
     ColorStop currentColor = colors[i];                      \\
     bool isInBetween = currentColor.position <= factor;      \\
     index = int(mix(float(index), float(i), float(isInBetween))); \\
  }                                                           \\
  ColorStop currentColor = colors[index];                     \\
  ColorStop nextColor = colors[index + 1];                    \\
  float range = nextColor.position - currentColor.position;   \\
  float lerpFactor = (factor - currentColor.position) / range; \\
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  
  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);
  
  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);
  
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
   * 3 hex color stops for the gradient wash.
   * Defaults to pastel tints derived from OPG Golden Orange and Golden Yellow.
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

// Derived from OPG brand tokens:
// #f29f04 (Golden Orange) ~70% white tint -> #fbe2b4
// #f2b705 (Golden Yellow) ~70% white tint -> #fbe9b4
// #d48a00 (Brand Amber) ~75% white tint   -> #f4e2bf
const DEFAULT_COLOR_STOPS = ['#fbe2b4', '#fbe9b4', '#f4e2bf']

export function Aurora({
  colorStops = DEFAULT_COLOR_STOPS,
  amplitude = 0.7,
  blend = 0.3,
  speed = 0.2,
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
    // Light theme multiply blend mode to softly wash over light backgrounds without washing out
    canvas.style.mixBlendMode = 'multiply'
    canvas.style.opacity = '0.85'
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

    const initialColorStops = colorStops.map((hex) => {
      const c = new Color(hex)
      return [c.r, c.g, c.b]
    })

    program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uColorStops: { value: initialColorStops },
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
      program.uniforms.uTime.value = t
      program.uniforms.uAmplitude.value = currentProps.amplitude
      program.uniforms.uBlend.value = currentProps.blend
      program.uniforms.uLightMode.value = currentProps.lightMode ? 1 : 0
      program.uniforms.uColorStops.value = currentProps.colorStops.map(
        (hex: string) => {
          const c = new Color(hex)
          return [c.r, c.g, c.b]
        },
      )
      renderer.render({ scene: mesh })
    }

    const update = (timestamp: number) => {
      if (isReducedMotion) {
        // Paused on static graceful composition for reduced motion preference
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
