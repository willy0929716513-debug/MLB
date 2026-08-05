'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${next}` },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div
      className="min-h-svh flex items-center justify-center px-4 py-16"
    >
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Card */}
        <div
          className="glass-card rounded-3xl overflow-hidden"
        >
          {/* Accent bar */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--cyan), var(--green))', backgroundSize: '200% auto', animation: 'gradient-flow 4s linear infinite' }} />

          <div className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(0,229,255,0.1)',
                  border: '1px solid rgba(0,229,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 30,
                  margin: '0 auto 16px',
                }}
              >
                ⚾
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)' }}>
                Sign In
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
                Enter your email — we&apos;ll send a magic link
              </p>
            </div>

            {sent ? (
              /* Sent state */
              <div
                className="text-center rounded-2xl p-6 space-y-3"
                style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}
              >
                <div style={{ fontSize: 40 }}>✉️</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>
                  Magic link sent!
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  Check <strong style={{ color: 'var(--text-1)' }}>{email}</strong> and click the link to sign in instantly.
                </p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{
                      display: 'block',
                      width: '100%',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      fontSize: 15,
                      color: 'var(--text-1)',
                      outline: 'none',
                      transition: 'border-color .2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = 'var(--border-hi)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </div>

                {error && (
                  <div
                    className="rounded-xl px-4 py-3"
                    style={{ background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.2)', fontSize: 13, color: 'var(--red)' }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full"
                  style={{ justifyContent: 'center', marginTop: 8 }}
                >
                  {loading ? 'Sending…' : 'Send Magic Link'}
                </button>
              </form>
            )}

            <p className="text-center mt-6" style={{ fontSize: 11, color: 'var(--text-2)' }}>
              No password needed · Instant secure access
            </p>
          </div>
        </div>

        {/* Back link */}
        <p className="text-center mt-6">
          <a href="/" style={{ fontSize: 13, color: 'var(--text-2)', textDecoration: 'none' }}>
            ← Back to Dashboard
          </a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center px-4">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div className="skeleton" style={{ height: 360, borderRadius: 24 }} />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
