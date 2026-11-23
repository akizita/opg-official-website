'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import styles from './site-splash-screen.module.css'

export const OPG_SPLASH_VIDEO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/splash/animation1.mp4'

const OPG_LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/opg-square-logo-1789740351319.png'

const SPLASH_SEEN_KEY = 'opg_splash_seen'
const SKIP_SPLASH_PREFIXES = ['/admin', '/auth', '/sign-in', '/sign-up'] as const

const VIDEO_START_TIMEOUT_MS = 2600
const VIDEO_STALL_TIMEOUT_MS = 1600
const FALLBACK_HOLD_MS = 1600
const MAX_SPLASH_DURATION_MS = 5600
const EXIT_ANIMATION_MS = 460

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() {
    v_uv = vec2((a_pos.x + 1.0) * 0.5, 1.0 - (a_pos.y + 1.0) * 0.5);
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  uniform sampler2D u_tex;
  uniform vec2 u_texel;
  varying vec2 v_uv;

  float getWarmth(vec3 c) {
    float maxRG = max(c.r, c.g);
    float maxC = max(maxRG, c.b);
    float minC = min(min(c.r, c.g), c.b);
    return max(maxC - minC, maxRG - c.b);
  }

  void main() {
    vec3 c = texture2D(u_tex, v_uv).rgb;
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    float warmth = getWarmth(c);
    float maxRG = max(c.r, c.g);
    float relWarm = (maxRG - c.b) / max(maxRG, 0.06);

    // Metallic gold emblem opacity (strictly reject neutral grey studio pixels)
    float goldAlpha = smoothstep(0.055, 0.135, warmth);

    // Keep deep bronze / dark gold 3D bevel rims sharp
    float darkBevel = smoothstep(0.22, 0.42, relWarm) * (1.0 - smoothstep(0.55, 0.72, luma));
    goldAlpha = max(goldAlpha, darkBevel * smoothstep(0.025, 0.065, warmth));

    // Protect bright white metallic glints tightly surrounded by gold inside the emblem
    float distCenter = length(v_uv - 0.5);
    if (luma > 0.89 && distCenter < 0.25) {
      float nw = max(
        max(getWarmth(texture2D(u_tex, v_uv + vec2(u_texel.x, 0.0)).rgb),
            getWarmth(texture2D(u_tex, v_uv - vec2(u_texel.x, 0.0)).rgb)),
        max(getWarmth(texture2D(u_tex, v_uv + vec2(0.0, u_texel.y)).rgb),
            getWarmth(texture2D(u_tex, v_uv - vec2(0.0, u_texel.y)).rgb))
      );
      if (nw > 0.22) {
        goldAlpha = max(goldAlpha, smoothstep(0.88, 0.95, luma));
      }
    }

    float alpha = clamp(goldAlpha, 0.0, 1.0);

    // Remove grey studio fringe on sub-pixel antialiased edges
    vec3 cleanEdgeGold = vec3(0.86, 0.61, 0.06);
    vec3 finalRgb = mix(cleanEdgeGold, c, smoothstep(0.0, 0.85, alpha));

    gl_FragColor = vec4(finalRgb * alpha, alpha);
  }
`

interface KeyedWebGLRenderer {
  drawFrame: (video: HTMLVideoElement) => boolean
  destroy: () => void
}

function createKeyedWebGLRenderer(
  canvas: HTMLCanvasElement,
): KeyedWebGLRenderer | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
  })
  if (!gl) return null

  const compileShader = (type: number, source: string) => {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
  const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
  if (!vs || !fs) {
    if (vs) gl.deleteShader(vs)
    if (fs) gl.deleteShader(fs)
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vs)
    gl.deleteShader(fs)
    return null
  }
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program)
    return null
  }

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  )

  const posLoc = gl.getAttribLocation(program, 'a_pos')
  const texLoc = gl.getUniformLocation(program, 'u_tex')
  const texelLoc = gl.getUniformLocation(program, 'u_texel')

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  gl.useProgram(program)
  gl.enableVertexAttribArray(posLoc)
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
  gl.uniform1i(texLoc, 0)
  gl.clearColor(0, 0, 0, 0)

  let lastWidth = 0
  let lastHeight = 0

  return {
    drawFrame(video: HTMLVideoElement) {
      if (video.readyState < 2 || video.videoWidth === 0) return false
      const targetWidth = Math.min(video.videoWidth, 960)
      const targetHeight = Math.round(
        (video.videoHeight / video.videoWidth) * targetWidth,
      )
      if (lastWidth !== targetWidth || lastHeight !== targetHeight) {
        lastWidth = targetWidth
        lastHeight = targetHeight
        canvas.width = targetWidth
        canvas.height = targetHeight
        gl.viewport(0, 0, targetWidth, targetHeight)
        gl.uniform2f(
          texelLoc,
          4 / Math.max(targetWidth, 1),
          4 / Math.max(targetHeight, 1),
        )
      }

      gl.clear(gl.COLOR_BUFFER_BIT)

      try {
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          video,
        )
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        return true
      } catch {
        return false
      }
    },
    destroy() {
      if (texture) gl.deleteTexture(texture)
      if (buffer) gl.deleteBuffer(buffer)
      gl.deleteProgram(program)
    },
  }
}

export function shouldSkipSplashForPath(pathname: string | null): boolean {
  if (!pathname) return false
  return SKIP_SPLASH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

export function shouldShowSplashOnMount(
  pathname: string | null,
  alreadySeenInSession: boolean,
  prefersReducedMotion: boolean,
): boolean {
  if (prefersReducedMotion || shouldSkipSplashForPath(pathname)) {
    return false
  }
  if (pathname === '/') {
    return true
  }
  return !alreadySeenInSession
}

export function SiteSplashScreen() {
  const pathname = usePathname()
  const skipRoute = shouldSkipSplashForPath(pathname)

  const overlayRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dismissedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<{
    maxTimer?: number
    startTimer?: number
    stallTimer?: number
    fallbackTimer?: number
    unmountTimer?: number
  }>({})

  const [isDone, setIsDone] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [isWebglFallback, setIsWebglFallback] = useState(false)

  const clearTimers = useCallback(() => {
    const t = timersRef.current
    if (t.maxTimer !== undefined) window.clearTimeout(t.maxTimer)
    if (t.startTimer !== undefined) window.clearTimeout(t.startTimer)
    if (t.stallTimer !== undefined) window.clearTimeout(t.stallTimer)
    if (t.fallbackTimer !== undefined) window.clearTimeout(t.fallbackTimer)
    if (t.unmountTimer !== undefined) window.clearTimeout(t.unmountTimer)
    timersRef.current = {}
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const dismissSplash = useCallback(() => {
    if (dismissedRef.current) return
    dismissedRef.current = true
    clearTimers()

    document.documentElement.style.overflow = ''

    const video = videoRef.current
    if (video) {
      video.pause()
    }

    setIsLeaving(true)

    const overlay = overlayRef.current
    const animations = overlay?.getAnimations?.() ?? []
    const finishUnmount = () => {
      const vid = videoRef.current
      if (vid) {
        vid.removeAttribute('src')
        vid.load()
      }
      setIsDone(true)
    }

    if (animations.length === 0) {
      document.documentElement.removeAttribute('data-splash-active')
      timersRef.current.unmountTimer = window.setTimeout(
        finishUnmount,
        EXIT_ANIMATION_MS,
      )
      return
    }

    document.documentElement.removeAttribute('data-splash-active')
    void Promise.race([
      Promise.allSettled(animations.map((anim) => anim.finished)),
      new Promise<void>((resolve) => {
        timersRef.current.unmountTimer = window.setTimeout(
          resolve,
          EXIT_ANIMATION_MS,
        )
      }),
    ]).then(finishUnmount)
  }, [clearTimers])

  useLayoutEffect(() => {
    if (skipRoute || dismissedRef.current) return

    let alreadySeen = false
    try {
      alreadySeen = window.sessionStorage.getItem(SPLASH_SEEN_KEY) === '1'
    } catch {
      alreadySeen = false
    }

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!shouldShowSplashOnMount(pathname, alreadySeen, prefersReduced)) {
      dismissedRef.current = true
      if (overlayRef.current) {
        overlayRef.current.hidden = true
        overlayRef.current.style.display = 'none'
      }
      queueMicrotask(() => setIsDone(true))
    }
  }, [pathname, skipRoute])

  useEffect(() => {
    if (skipRoute || isDone || dismissedRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video) return

    let cancelled = false

    try {
      window.sessionStorage.setItem(SPLASH_SEEN_KEY, '1')
    } catch {
      // Ignore storage access errors in restricted contexts
    }

    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.setAttribute('data-splash-active', 'true')

    const renderer = canvas ? createKeyedWebGLRenderer(canvas) : null
    let useMaskedVideoFallback = renderer === null

    let videoStarted = false
    let enteredFallback = false
    let vfcHandle: number | null = null
    let lastDrawnTime = -1

    const videoWithVfc = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number
      cancelVideoFrameCallback?: (handle: number) => void
    }

    const stopRenderLoop = () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (
        vfcHandle !== null &&
        typeof videoWithVfc.cancelVideoFrameCallback === 'function'
      ) {
        videoWithVfc.cancelVideoFrameCallback(vfcHandle)
        vfcHandle = null
      }
    }

    const activateFallback = () => {
      if (cancelled || dismissedRef.current || videoStarted || enteredFallback) {
        return
      }
      enteredFallback = true
      stopRenderLoop()
      if (timersRef.current.startTimer !== undefined) {
        window.clearTimeout(timersRef.current.startTimer)
      }
      video.pause()
      setIsFallback(true)
      timersRef.current.fallbackTimer = window.setTimeout(
        dismissSplash,
        FALLBACK_HOLD_MS,
      )
    }

    const markVideoReady = () => {
      if (cancelled || dismissedRef.current || enteredFallback) return
      videoStarted = true
      if (timersRef.current.startTimer !== undefined) {
        window.clearTimeout(timersRef.current.startTimer)
      }
      if (useMaskedVideoFallback) {
        setIsWebglFallback(true)
      }
      setIsVideoReady(true)
    }

    const scheduleNextFrame = () => {
      if (cancelled || dismissedRef.current || enteredFallback || useMaskedVideoFallback) {
        return
      }
      if (typeof videoWithVfc.requestVideoFrameCallback === 'function') {
        vfcHandle = videoWithVfc.requestVideoFrameCallback(onFrameReady)
      } else {
        rafRef.current = window.requestAnimationFrame(onFrameReady)
      }
    }

    const onFrameReady = () => {
      if (cancelled || dismissedRef.current || enteredFallback) return
      if (!useMaskedVideoFallback && renderer) {
        if (!video.paused && video.readyState >= 2) {
          if (video.currentTime !== lastDrawnTime || !videoStarted) {
            const drew = renderer.drawFrame(video)
            if (drew) {
              lastDrawnTime = video.currentTime
              if (!videoStarted) {
                markVideoReady()
              }
            } else if (!videoStarted) {
              useMaskedVideoFallback = true
              markVideoReady()
              return
            }
          }
        }
        scheduleNextFrame()
      }
    }

    const handlePlaying = () => {
      if (cancelled) return
      if (timersRef.current.stallTimer !== undefined) {
        window.clearTimeout(timersRef.current.stallTimer)
      }
      if (useMaskedVideoFallback) {
        window.requestAnimationFrame(markVideoReady)
      } else {
        stopRenderLoop()
        scheduleNextFrame()
      }
    }

    const handleWaiting = () => {
      if (cancelled || !videoStarted || dismissedRef.current) return
      if (timersRef.current.stallTimer !== undefined) {
        window.clearTimeout(timersRef.current.stallTimer)
      }
      timersRef.current.stallTimer = window.setTimeout(
        dismissSplash,
        VIDEO_STALL_TIMEOUT_MS,
      )
    }

    const handleEnded = () => {
      if (cancelled) return
      dismissSplash()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissSplash()
      }
    }

    const startPlayback = () => {
      if (cancelled || dismissedRef.current) return
      const playPromise = video.play()
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise
          .then(() => {
            if (cancelled) return
            if (useMaskedVideoFallback && video.readyState >= 2 && !video.paused) {
              window.requestAnimationFrame(markVideoReady)
            } else if (!useMaskedVideoFallback) {
              stopRenderLoop()
              scheduleNextFrame()
            }
          })
          .catch(() => {
            if (!cancelled) {
              activateFallback()
            }
          })
      }
    }

    video.addEventListener('playing', handlePlaying)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('ended', handleEnded, { once: true })
    video.addEventListener('error', activateFallback)
    video.addEventListener('canplay', startPlayback, { once: true })
    window.addEventListener('keydown', handleKeyDown)

    timersRef.current.maxTimer = window.setTimeout(
      dismissSplash,
      MAX_SPLASH_DURATION_MS,
    )
    timersRef.current.startTimer = window.setTimeout(
      activateFallback,
      VIDEO_START_TIMEOUT_MS,
    )

    if (video.getAttribute('src') !== OPG_SPLASH_VIDEO_URL) {
      video.src = OPG_SPLASH_VIDEO_URL
    }

    if (video.readyState >= 3) {
      startPlayback()
    }

    return () => {
      cancelled = true
      stopRenderLoop()
      clearTimers()
      renderer?.destroy()
      document.documentElement.style.overflow = previousOverflow
      document.documentElement.removeAttribute('data-splash-active')
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', activateFallback)
      video.removeEventListener('canplay', startPlayback)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [clearTimers, dismissSplash, isDone, skipRoute])

  if (skipRoute || isDone) {
    return null
  }

  return (
    <div
      ref={overlayRef}
      aria-hidden={isLeaving ? 'true' : undefined}
      aria-label="Outsourced Pro Global welcome animation"
      aria-live="polite"
      className={styles.splashScreen}
      data-fallback={isFallback ? 'true' : undefined}
      data-leaving={isLeaving ? 'true' : undefined}
      data-video-ready={isVideoReady ? 'true' : undefined}
      data-webgl-fallback={isWebglFallback ? 'true' : undefined}
      role="status"
    >
      {/* Yellow Aura Ambient Glows */}
      <div aria-hidden="true" className={styles.auraOrbPrimary} />
      <div aria-hidden="true" className={styles.auraOrbSecondary} />

      <div className={styles.mediaStage}>
        <video
          ref={videoRef}
          aria-hidden="true"
          className={styles.sourceVideo}
          crossOrigin="anonymous"
          muted
          playsInline
          preload="auto"
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={styles.keyedCanvas}
        />
      </div>

      <div className={styles.fallbackContent}>
        <div className={styles.fallbackBrand}>
          <Image
            alt=""
            className={styles.fallbackLogo}
            height={76}
            priority
            src={OPG_LOGO_URL}
            unoptimized
            width={76}
          />
          <span className={styles.fallbackWordmark}>
            <span>Outsourced</span>
            <span className={styles.fallbackWordmarkAccent}>Pro Global</span>
          </span>
        </div>
        <p className={styles.fallbackTagline}>
          Connecting global ambition with exceptional offshore talent.
        </p>
      </div>

      <button
        aria-label="Skip intro animation"
        className={styles.skipButton}
        onClick={dismissSplash}
        type="button"
      >
        <span>Skip</span>
        <svg
          aria-hidden="true"
          fill="none"
          height="12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
          width="12"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
