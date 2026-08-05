'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const [countdown, setCountdown] = useState(5)
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const isMonthly = plan === 'monthly'

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(t); window.location.href = '/'; return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-svh flex items-center justify-center px-4 py-16">
      <div style={{ width: '100%', maxWidth: 420 }} className="text-center">

        {/* Card */}
        <div className="glass-card rounded-3xl overflow-hidden">
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--cyan), var(--green))', backgroundSize: '200% auto', animation: 'gradient-flow 4s linear infinite' }} />

          <div className="p-10">
            {/* Animated checkmark */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'rgba(0,255,136,0.12)',
                border: '2px solid rgba(0,255,136,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 36,
                margin: '0 auto 20px',
                animation: 'float 4s ease-in-out infinite',
              }}
            >
              ✓
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--green)' }}>
              Payment Successful!
            </h1>

            <p style={{ fontSize: 15, color: 'var(--text-2)', marginTop: 10, lineHeight: 1.6 }}>
              {isMonthly
                ? 'Your monthly subscription is now active. You have full access to all daily predictions.'
                : 'Your 24-hour day pass is now active. Enjoy today\'s full prediction suite.'}
            </p>

            <div
              className="rounded-2xl mt-6 p-4"
              style={{ background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}
            >
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                {isMonthly ? 'Plan Active' : 'Access Expires'}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--cyan)' }}>
                {isMonthly ? 'Monthly Subscription ⚡' : 'Today Only · 24 Hours'}
              </div>
            </div>

            <Link
              href="/"
              className="btn-primary mt-6"
              style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
            >
              View Predictions Now
            </Link>

            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 14 }}>
              Redirecting in{' '}
              <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{countdown}s</span>
              …
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-svh flex items-center justify-center px-4">
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div className="skeleton" style={{ height: 440, borderRadius: 24 }} />
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
