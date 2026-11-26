'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { OpgIconSend } from '@/components/icons/opg-icons'

import styles from './site-faq-widget.module.css'

const OPG_BOT_LOGO_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/logo-1789740351319.png'

const GREETING_MESSAGE =
  'Hi! Ask me anything about Outsourced Pro Global’s recruitment services, pricing, payroll administration, hiring timelines, or applying for roles.'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ id: string; question: string; category: string }>
  showContactCta?: boolean
}

type FaqDirectoryPayload = {
  starterQuestions: string[]
}

const SUPPRESSED_PREFIXES = [
  '/admin',
  '/sign-in',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
]

const FAQ_HINT_DISMISSED_KEY = 'opg_faq_hint_dismissed'
const hintDismissListeners = new Set<() => void>()

function subscribeHintDismissed(listener: () => void) {
  hintDismissListeners.add(listener)
  return () => {
    hintDismissListeners.delete(listener)
  }
}

function getHintDismissedSnapshot(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.sessionStorage.getItem(FAQ_HINT_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

function getHintDismissedServerSnapshot(): boolean {
  return false
}

function dismissFaqHint() {
  try {
    window.sessionStorage.setItem(FAQ_HINT_DISMISSED_KEY, '1')
  } catch {
    // Ignore storage errors in restricted environments
  }
  hintDismissListeners.forEach((listener) => listener())
}

function isSuppressedPath(pathname: string | null): boolean {
  if (!pathname) return false
  return SUPPRESSED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function renderInlineFormattedText(
  text: string,
  onNavigate: () => void,
): React.ReactNode[] {
  const tokenRegex =
    /(\*\*[^*]+\*\*|recruitment@opglobal\.com\.hk|\/(?:contact|careers|about|clients|testimonials|privacy|security)\b)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(<strong key={`${match.index}-b`}>{token.slice(2, -2)}</strong>)
    } else if (token === 'recruitment@opglobal.com.hk') {
      parts.push(
        <a
          className={styles.inlineActionLink}
          href="mailto:recruitment@opglobal.com.hk"
          key={`${match.index}-mail`}
        >
          {token}
        </a>,
      )
    } else {
      parts.push(
        <Link
          className={styles.inlineActionLink}
          href={token}
          key={`${match.index}-link`}
          onClick={onNavigate}
        >
          {token}
        </Link>,
      )
    }
    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function FormattedAssistantMessage({
  content,
  onNavigate,
}: {
  content: string
  onNavigate: () => void
}) {
  const blocks = content.split(/\n{2,}/)

  return (
    <>
      {blocks.map((block, blockIndex) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
        const bulletLines = lines.filter((line) =>
          /^([*\-•]|\d+[.)])\s+/.test(line),
        )

        if (bulletLines.length > 0 && bulletLines.length === lines.length) {
          return (
            <ul className={styles.msgList} key={blockIndex}>
              {lines.map((line, idx) => (
                <li key={idx}>
                  {renderInlineFormattedText(
                    line.replace(/^([*\-•]|\d+[.)])\s+/, ''),
                    onNavigate,
                  )}
                </li>
              ))}
            </ul>
          )
        }

        return (
          <p className={styles.msgParagraph} key={blockIndex}>
            {lines.map((line, idx) => (
              <Fragment key={idx}>
                {idx > 0 && <br />}
                {renderInlineFormattedText(line, onNavigate)}
              </Fragment>
            ))}
          </p>
        )
      })}
    </>
  )
}

function OpgBotAvatar({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={className}>
      <Image
        alt=""
        className={styles.brandLogoImg}
        height={32}
        src={OPG_BOT_LOGO_URL}
        width={32}
      />
    </span>
  )
}

export function SiteFaqWidget() {
  const pathname = usePathname()
  const shouldReduceMotion = Boolean(useReducedMotion())
  const hintDismissed = useSyncExternalStore(
    subscribeHintDismissed,
    getHintDismissedSnapshot,
    getHintDismissedServerSnapshot,
  )

  const [isOpen, setIsOpen] = useState(false)
  const [greetingStage, setGreetingStage] = useState<'idle' | 'typing' | 'sent'>(
    'idle',
  )
  const [directory, setDirectory] = useState<FaqDirectoryPayload | null>(null)
  const [directoryLoading, setDirectoryLoading] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [nextTurnId, setNextTurnId] = useState(1)
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const chatBodyRef = useRef<HTMLDivElement>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const suppressed = isSuppressedPath(pathname)

  function loadDirectory() {
    if (directory || directoryLoading || suppressed) return

    setDirectoryLoading(true)
    void fetch('/api/faq')
      .then(async (res) => {
        if (!res.ok) return null
        return (await res.json()) as FaqDirectoryPayload
      })
      .then((data) => {
        if (data) {
          setDirectory(data)
        }
      })
      .catch(() => {
        // Keep chat operational even if initial starter question fetch fails
      })
      .finally(() => {
        setDirectoryLoading(false)
      })
  }

  function handleToggleOpen() {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    if (nextOpen) {
      loadDirectory()
      if (greetingStage === 'idle') {
        setGreetingStage('typing')
      }
    }
  }

  useEffect(() => {
    if (!isOpen || greetingStage !== 'typing') return

    const delayMs = shouldReduceMotion ? 100 : 720
    const timer = window.setTimeout(() => {
      setGreetingStage('sent')
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [greetingStage, isOpen, shouldReduceMotion])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        launcherRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 110)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    if (!chatBodyRef.current) return
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
  }, [greetingStage, messages, isStreaming])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  if (suppressed) return null

  async function sendQuestion(rawQuestion: string) {
    const question = rawQuestion.trim()
    if (question.length < 2 || isStreaming) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const userMsgId = `u-${nextTurnId}`
    const assistantMsgId = `a-${nextTurnId}`
    setNextTurnId((n) => n + 1)

    const recentHistory = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    if (greetingStage !== 'sent') {
      setGreetingStage('sent')
    }
    setInputValue('')
    setIsStreaming(true)
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: question },
      { id: assistantMsgId, role: 'assistant', content: '' },
    ])

    try {
      const response = await fetch('/api/faq/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          history: recentHistory,
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const errorJson = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(
          errorJson?.error ||
            'Could not retrieve an answer right now. Please try again.',
        )
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const rawEvent of events) {
          const line = rawEvent
            .split('\n')
            .find((entry) => entry.startsWith('data: '))
          if (!line) continue

          const parsed = JSON.parse(line.slice(6)) as {
            type: 'delta' | 'done'
            text?: string
            sources?: Array<{ id: string; question: string; category: string }>
            showContactCta?: boolean
          }

          if (parsed.type === 'delta' && parsed.text) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: msg.content + parsed.text }
                  : msg,
              ),
            )
          } else if (parsed.type === 'done') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMsgId
                  ? {
                      ...msg,
                      sources: parsed.sources ?? [],
                      showContactCta: Boolean(parsed.showContactCta),
                    }
                  : msg,
              ),
            )
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      const errMessage =
        error instanceof Error && error.message
          ? error.message
          : 'Unable to connect right now. Please reach us at /contact or recruitment@opglobal.com.hk.'
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: errMessage,
                showContactCta: true,
              }
            : msg,
        ),
      )
    } finally {
      setIsStreaming(false)
    }
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendQuestion(inputValue)
  }

  const starterQuestions = directory?.starterQuestions ?? []

  return (
    <div className={styles.faqRoot}>
      <AnimatePresence>
        {isOpen && (
          <motion.section
            animate={{ opacity: 1, scale: 1, y: 0 }}
            aria-label="OPG FAQ Assistant"
            className={styles.panel}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 12 }
            }
            id="opg-faq-assistant-panel"
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.96, y: 14 }
            }
            role="dialog"
            transition={
              shouldReduceMotion
                ? { duration: 0.01 }
                : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
            }
          >
            <header className={styles.panelHeader}>
              <div className={styles.headerTop}>
                <div className={styles.brandRow}>
                  <OpgBotAvatar className={styles.brandAvatar} />
                  <div className={styles.headerTitles}>
                    <h2 className={styles.headerTitle}>OPG FAQ Assistant</h2>
                    <p className={styles.headerSubtitle}>
                      Answers grounded in official OPG documentation
                    </p>
                  </div>
                </div>
                <div className={styles.headerActions}>
                  {messages.length > 0 && (
                    <button
                      aria-label="Clear conversation"
                      className={styles.iconBtn}
                      onClick={() => {
                        abortRef.current?.abort()
                        setMessages([])
                        setIsStreaming(false)
                        setGreetingStage('typing')
                      }}
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    aria-label="Close FAQ assistant"
                    className={`${styles.iconBtn} ${styles.iconBtnSquare}`}
                    onClick={() => {
                      setIsOpen(false)
                      launcherRef.current?.focus()
                    }}
                    type="button"
                  >
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={Cancel01Icon}
                      size={16}
                    />
                  </button>
                </div>
              </div>
            </header>

            <div
              aria-live="polite"
              className={styles.chatBody}
              ref={chatBodyRef}
            >
              {greetingStage !== 'idle' && (
                <div className={styles.assistantLine}>
                  <OpgBotAvatar className={styles.botMsgAvatar} />
                  <div className={styles.botMsgStack}>
                    <AnimatePresence mode="wait">
                      {greetingStage === 'typing' ? (
                        <motion.div
                          animate={{ opacity: 1, y: 0 }}
                          className={`${styles.msgBubble} ${styles.msgBubbleAssistant}`}
                          exit={{ opacity: 0 }}
                          initial={
                            shouldReduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: 6 }
                          }
                          key="greeting-typing"
                          transition={{ duration: 0.16 }}
                        >
                          <span
                            aria-label="OPG Assistant is typing"
                            className={styles.typingDots}
                          >
                            <span />
                            <span />
                            <span />
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          className={`${styles.msgBubble} ${styles.msgBubbleAssistant}`}
                          initial={
                            shouldReduceMotion
                              ? { opacity: 0 }
                              : { opacity: 0, scale: 0.98, y: 6 }
                          }
                          key="greeting-sent"
                          transition={{
                            duration: shouldReduceMotion ? 0.01 : 0.22,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          {GREETING_MESSAGE}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {greetingStage === 'sent' &&
                  messages.length === 0 &&
                  starterQuestions.length > 0 && (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className={styles.starterBlock}
                      exit={{ opacity: 0, y: -4 }}
                      initial={
                        shouldReduceMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 10 }
                      }
                      transition={{
                        duration: shouldReduceMotion ? 0.01 : 0.24,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <p className={styles.starterHeading}>Popular questions</p>
                      <div className={styles.starterChips}>
                        {starterQuestions.map((question, idx) => (
                          <motion.button
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className={styles.starterChip}
                            disabled={isStreaming}
                            initial={
                              shouldReduceMotion
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.96, y: 6 }
                            }
                            key={question}
                            onClick={() => void sendQuestion(question)}
                            transition={{
                              delay: shouldReduceMotion ? 0 : idx * 0.05,
                              duration: shouldReduceMotion ? 0.01 : 0.2,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            type="button"
                          >
                            {question}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
              </AnimatePresence>

              {messages.map((msg) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={`${styles.msgRow} ${
                    msg.role === 'user'
                      ? styles.msgRowUser
                      : styles.msgRowAssistant
                  }`}
                  initial={
                    shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                  }
                  key={msg.id}
                  transition={{
                    duration: shouldReduceMotion ? 0.01 : 0.18,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {msg.role === 'user' ? (
                    <div
                      className={`${styles.msgBubble} ${styles.msgBubbleUser}`}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div className={styles.assistantLine}>
                      <OpgBotAvatar className={styles.botMsgAvatar} />
                      <div className={styles.botMsgStack}>
                        <div
                          className={`${styles.msgBubble} ${styles.msgBubbleAssistant}`}
                        >
                          {msg.content ? (
                            <FormattedAssistantMessage
                              content={msg.content}
                              onNavigate={() => setIsOpen(false)}
                            />
                          ) : (
                            <span
                              aria-label="Generating answer"
                              className={styles.typingDots}
                            >
                              <span />
                              <span />
                              <span />
                            </span>
                          )}
                        </div>

                        {msg.sources && msg.sources.length > 0 && (
                          <div className={styles.sourcesRow}>
                            {msg.sources.map((src) => (
                              <span
                                className={styles.sourceChip}
                                key={src.id}
                                title={src.question}
                              >
                                {src.question}
                              </span>
                            ))}
                          </div>
                        )}

                        {msg.showContactCta && (
                          <Link
                            className={styles.contactHandoffBtn}
                            href="/contact"
                            onClick={() => setIsOpen(false)}
                          >
                            <span>Contact OPG Team</span>
                            <HugeiconsIcon
                              aria-hidden="true"
                              icon={ArrowRight01Icon}
                              size={14}
                            />
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <form className={styles.composer} onSubmit={handleFormSubmit}>
              <div className={styles.composerShell}>
                <input
                  aria-label="Ask an FAQ question"
                  className={styles.composerInput}
                  disabled={isStreaming}
                  maxLength={500}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question about OPG..."
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                />
                <button
                  aria-label="Send question"
                  className={styles.sendBtn}
                  disabled={isStreaming || inputValue.trim().length < 2}
                  type="submit"
                >
                  <OpgIconSend size={16} />
                </button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <div
        className={`${styles.launcherWrap} ${
          !isOpen && !shouldReduceMotion ? styles.launcherFloating : ''
        }`}
      >
        <AnimatePresence>
          {!isOpen && !hintDismissed && (
            <motion.div
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className={styles.launcherHint}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.94, x: 10 }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.95, x: 12 }
              }
              key="faq-floating-hint"
              transition={{
                duration: shouldReduceMotion ? 0.01 : 0.24,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.015, y: -1 }}
            >
              <button
                aria-label="If you need to ask something, click here to open FAQ Assistant"
                className={styles.launcherHintTrigger}
                onClick={handleToggleOpen}
                type="button"
              >
                <span aria-hidden="true" className={styles.launcherHintDot} />
                <span>If you need to ask something, click here</span>
              </button>
              <button
                aria-label="Hide FAQ prompt"
                className={styles.launcherHintClose}
                onClick={dismissFaqHint}
                title="Hide prompt"
                type="button"
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Cancel01Icon}
                  size={12}
                  strokeWidth={2.4}
                />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          aria-controls="opg-faq-assistant-panel"
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close FAQ Assistant' : 'Open FAQ Assistant'}
          className={styles.launcherBtn}
          onClick={handleToggleOpen}
          ref={launcherRef}
          title={isOpen ? 'Close FAQ Assistant' : 'Open FAQ Assistant'}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          type="button"
          whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.04 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
        >
          <AnimatePresence initial={false} mode="wait">
            {isOpen ? (
              <motion.span
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                className={styles.launcherIconInner}
                exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                key="faq-close-icon"
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.16 }}
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={Cancel01Icon}
                  size={21}
                  strokeWidth={2.2}
                />
              </motion.span>
            ) : (
              <motion.span
                animate={{ opacity: 1, scale: 1 }}
                className={styles.launcherFaqText}
                exit={{ opacity: 0, scale: 0.75 }}
                initial={{ opacity: 0, scale: 0.75 }}
                key="faq-label-badge"
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.16 }}
              >
                FAQ
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}
