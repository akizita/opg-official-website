'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function MfaChallengeForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your authenticator app.')
      return
    }

    setIsVerifying(true)
    const supabase = createClient()
    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors()
    const factor = factors?.totp.find((item) => item.status === 'verified')

    if (factorsError || !factor) {
      setIsVerifying(false)
      setError('No verified authenticator was found. Sign out and try again.')
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    })
    setIsVerifying(false)

    if (verifyError) {
      setError('That code was not accepted. Wait for a new code and try again.')
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <form className="auth-form" onSubmit={verifyCode}>
      <label className="field" htmlFor="mfa-code">
        <span>6-digit verification code</span>
        <input
          autoComplete="one-time-code"
          autoFocus
          id="mfa-code"
          inputMode="numeric"
          maxLength={6}
          name="code"
          onChange={(event) =>
            setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
          }
          pattern="[0-9]{6}"
          required
          type="text"
          value={code}
        />
      </label>
      {error ? (
        <p className="form-message form-message--error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button" disabled={isVerifying} type="submit">
        {isVerifying ? 'Verifying…' : 'Verify and continue'}
      </button>
    </form>
  )
}
