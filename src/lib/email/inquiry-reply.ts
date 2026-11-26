import { readFileSync } from 'node:fs'
import path from 'node:path'

const RESEND_API_URL = 'https://api.resend.com/emails'
const OPG_LOGO_CID = 'opg-logo'
const OPG_LOGO_FALLBACK_URL =
  'https://ursafbeufgmlxhxnflvh.supabase.co/storage/v1/object/public/public-media/general/logo-1789740351319.png'

let cachedLogoBase64: string | null | undefined

export type SendInquiryReplyInput = {
  body: string
  referenceId: string
  replyTo?: string | null
  subject: string
  to: string
  toName: string
}

export type SendInquiryReplyResult =
  | { configured: true; messageId: string | null; ok: true }
  | { configured: boolean; error: string; ok: false }

type InlineAttachment = {
  content: string
  content_id: string
  content_type: string
  filename: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getInlineLogoAttachment(): InlineAttachment | null {
  if (cachedLogoBase64 === undefined) {
    try {
      const logoPath = path.join(
        process.cwd(),
        'public',
        'images',
        'logo-1789740351319.png',
      )
      cachedLogoBase64 = readFileSync(logoPath).toString('base64')
    } catch {
      cachedLogoBase64 = null
    }
  }

  if (!cachedLogoBase64) return null

  return {
    filename: 'opg-logo.png',
    content: cachedLogoBase64,
    content_id: OPG_LOGO_CID,
    content_type: 'image/png',
  }
}

function formatReplyHtml({
  body,
  logoSrc,
  referenceId,
  subject,
}: {
  body: string
  logoSrc: string
  referenceId: string
  subject: string
}): string {
  const fontStack =
    "-apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','Segoe UI',Roboto,Helvetica,Arial,sans-serif"

  const paragraphs = body
    .trim()
    .split(/\n{2,}/)
    .map(
      (chunk) =>
        `<p style="margin:0 0 15px;color:#1c1c1e;font-family:${fontStack};font-size:15px;line-height:1.65;letter-spacing:-0.01em;">${escapeHtml(chunk).replace(/\n/g, '<br />')}</p>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px 12px;background-color:#ffffff;font-family:${fontStack};color:#1c1c1e;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#ffffff;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;background-color:#ffffff;border:1px solid rgba(60,60,67,0.12);border-radius:24px;overflow:hidden;box-shadow:0 12px 36px rgba(0,0,0,0.06);">
            <!-- Clean iOS-Inspired Light Header with Brand Identity -->
            <tr>
              <td style="padding:20px 26px;background:rgba(255,255,255,0.88);border-bottom:1px solid rgba(60,60,67,0.1);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td valign="middle">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td valign="middle" style="padding-right:12px;">
                            <img src="${escapeHtml(logoSrc)}" alt="Outsourced Pro Global" width="36" height="36" style="display:block;width:36px;height:36px;border:0;border-radius:10px;" />
                          </td>
                          <td valign="middle">
                            <div style="font-family:${fontStack};font-size:16px;line-height:1.2;font-weight:600;letter-spacing:-0.02em;color:#1c1c1e;">
                              OutPro Global
                            </div>
                            <div style="margin-top:2px;font-family:${fontStack};font-size:12px;line-height:1.2;font-weight:400;color:#6e6e73;">
                              Outsourced Pro Global
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" valign="middle" style="font-family:${fontStack};font-size:12px;font-weight:500;color:#6e6e73;white-space:nowrap;">
                      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#f5a623;vertical-align:middle;margin-right:6px;"></span><span style="vertical-align:middle;">Official Reply</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Glassmorphism Inquiry Response Bar -->
            <tr>
              <td style="padding:20px 26px 4px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f6;background:rgba(242,242,247,0.72);border:1px solid rgba(60,60,67,0.1);border-radius:16px;-webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%);box-shadow:inset 0 1px 0 rgba(255,255,255,0.9),0 4px 14px rgba(0,0,0,0.03);">
                  <tr>
                    <td style="padding:14px 16px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="font-family:${fontStack};font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#6e6e73;">
                            Inquiry Response
                          </td>
                          <td align="right" style="font-family:${fontStack};font-size:12px;font-weight:500;color:#6e6e73;">
                            ${escapeHtml(referenceId)}
                          </td>
                        </tr>
                      </table>
                      <div style="margin-top:5px;font-family:${fontStack};font-size:15px;line-height:1.38;font-weight:600;letter-spacing:-0.015em;color:#1c1c1e;">
                        ${escapeHtml(subject)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Message Body -->
            <tr>
              <td style="padding:20px 26px 10px;">
                ${paragraphs}
              </td>
            </tr>

            <!-- Seamless Hairline Footer -->
            <tr>
              <td style="padding:16px 26px 20px;border-top:1px solid rgba(60,60,67,0.09);">
                <div style="font-family:${fontStack};font-size:12px;line-height:1.5;color:#6e6e73;">
                  <strong style="color:#1c1c1e;font-weight:600;">Outsourced Pro Global</strong> &middot; Global talent solutions with a human point of view.
                </div>
                <div style="margin-top:4px;font-family:${fontStack};font-size:12px;line-height:1.45;color:#8e8e93;">
                  You can reply directly to this email thread &middot; Reference ${escapeHtml(referenceId)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function normalizeFromAddress(rawFrom: string): string {
  const unquoted = rawFrom
    .trim()
    .replace(/^(['"])(.*)\1$/, '$2')
    .trim()
  if (unquoted.includes('<')) return unquoted
  return `OutPro Global <${unquoted}>`
}

async function sendViaResend({
  attachments,
  html,
  replyTo,
  subject,
  text,
  to,
}: {
  attachments?: InlineAttachment[]
  html: string
  replyTo?: string | null
  subject: string
  text: string
  to: string
}): Promise<SendInquiryReplyResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const rawFrom = process.env.CONTACT_FROM_EMAIL?.trim()

  if (!apiKey || !rawFrom) {
    return {
      ok: false,
      configured: false,
      error:
        'Email delivery is not configured yet. Set RESEND_API_KEY and CONTACT_FROM_EMAIL in .env.local so replies send automatically.',
    }
  }

  const cleanTo = to.trim()
  if (!cleanTo || !cleanTo.includes('@')) {
    return {
      ok: false,
      configured: true,
      error: 'The recipient does not have a valid email address.',
    }
  }

  const payload: Record<string, unknown> = {
    from: normalizeFromAddress(rawFrom),
    to: [cleanTo],
    subject: subject.trim(),
    text,
    html,
  }

  if (attachments && attachments.length > 0) {
    payload.attachments = attachments
  }

  const cleanReplyTo = replyTo?.trim()
  if (cleanReplyTo && cleanReplyTo.includes('@')) {
    payload.reply_to = cleanReplyTo
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = (await response.json().catch(() => ({}))) as {
      id?: string
      message?: string
      name?: string
    }

    if (!response.ok) {
      return {
        ok: false,
        configured: true,
        error:
          data.message?.trim() ||
          `Email provider rejected the email (HTTP ${response.status}).`,
      }
    }

    return {
      ok: true,
      configured: true,
      messageId: typeof data.id === 'string' ? data.id : null,
    }
  } catch {
    return {
      ok: false,
      configured: true,
      error:
        'Could not reach the email delivery service. Please try again shortly.',
    }
  }
}

/**
 * Sends a direct branded email reply to a contact inquiry sender via Resend.
 */
export async function sendInquiryReplyEmail(
  input: SendInquiryReplyInput,
): Promise<SendInquiryReplyResult> {
  const to = input.to.trim()
  const subject = input.subject.trim()
  const body = input.body.trim()

  if (!to || !to.includes('@')) {
    return {
      ok: false,
      configured: true,
      error: 'The contact does not have a valid recipient email address.',
    }
  }

  if (!subject) {
    return {
      ok: false,
      configured: true,
      error: 'Please enter an email subject before sending.',
    }
  }

  if (!body) {
    return {
      ok: false,
      configured: true,
      error: 'Please write a reply message before sending.',
    }
  }

  const inlineLogo = getInlineLogoAttachment()

  return sendViaResend({
    to,
    subject,
    replyTo: input.replyTo,
    text: `${body}\n\n---\nOutsourced Pro Global · Reference: ${input.referenceId}`,
    html: formatReplyHtml({
      body,
      logoSrc: inlineLogo ? `cid:${OPG_LOGO_CID}` : OPG_LOGO_FALLBACK_URL,
      referenceId: input.referenceId,
      subject,
    }),
    attachments: inlineLogo ? [inlineLogo] : undefined,
  })
}
