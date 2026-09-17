type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const REDACTED_KEYS = new Set([
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'access_token',
  'refresh_token',
  'supabase_secret_key',
  'turnstile_secret_key',
  'resend_api_key',
])

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '')
  for (const redacted of REDACTED_KEYS) {
    if (normalized.includes(redacted)) return true
  }
  return false
}

export function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) return data

  if (typeof data === 'string') {
    // Redact JWT or Bearer patterns
    if (/^bearer\s+[a-zA-Z0-9._-]+/i.test(data)) {
      return 'Bearer [REDACTED]'
    }
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item))
  }

  if (typeof data === 'object') {
    if (data instanceof Error) {
      return {
        message: data.message,
        name: data.name,
        stack: process.env.NODE_ENV !== 'production' ? data.stack : undefined,
      }
    }

    const clean: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        clean[key] = '[REDACTED]'
      } else {
        clean[key] = redactSensitiveData(value)
      }
    }
    return clean
  }

  return data
}

type LogEntry = {
  level: LogLevel
  message: string
  payload?: unknown
  timestamp: string
}

function emitLog(level: LogLevel, message: string, payload?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    payload: payload !== undefined ? redactSensitiveData(payload) : undefined,
    timestamp: new Date().toISOString(),
  }

  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction) {
    // Structured JSON for production monitoring ingestion
    const output = JSON.stringify(entry)
    if (level === 'error') {
      console.error(output)
    } else if (level === 'warn') {
      console.warn(output)
    } else {
      console.log(output)
    }
  } else {
    // Readable console formatting for local development
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] ${message}`
    if (level === 'error') {
      console.error(prefix, entry.payload ?? '')
    } else if (level === 'warn') {
      console.warn(prefix, entry.payload ?? '')
    } else {
      console.log(prefix, entry.payload ?? '')
    }
  }
}

export const logger = {
  debug: (message: string, payload?: unknown) =>
    emitLog('debug', message, payload),
  info: (message: string, payload?: unknown) =>
    emitLog('info', message, payload),
  warn: (message: string, payload?: unknown) =>
    emitLog('warn', message, payload),
  error: (message: string, payload?: unknown) =>
    emitLog('error', message, payload),
}
