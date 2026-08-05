'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANS } from '@/lib/plans'

export default function PricingPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [agreed, setAgreed]   = useState(false)

  const handleCheckout = async (plan: 'monthly' | 'day_pass') => {
    if (!agreed) return
    setLoading(plan)
    try {
      const res  = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (res.status === 401) {
        router.push('/login?next=/pricing')
      }
    } catch {
      alert('Checkout error — please try again')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

      {/* Header */}
      <div className="text-center mb-12">
        <span className="badge badge-cyan" style={{ marginBottom: 16 }}>
          Simple Pricing
        </span>
        <h1
          className="gradient-text-anim font-bold"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}
        >
          Unlock Every Pick
        </h1>
        <p style={{ fontSize: 17, color: 'var(--text-2)', marginTop: 12, maxWidth: 480, margin: '12px auto 0' }}>
          Institutional-grade MLB analytics with edge, confidence and Kelly stake for every recommendation.
        </p>
      </div>

      {/* Disclaimer */}
      <div
        className="rounded-2xl px-5 py-4 mb-10 max-w-2xl mx-auto"
        style={{
          background: 'rgba(255,184,0,0.05)',
          border: '1px solid rgba(255,184,0,0.2)',
        }}
      >
        <div className="flex items-start gap-3">
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>
              Disclaimer / 免責聲明
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
              All predictions are <strong style={{ color: 'var(--text-1)' }}>for reference only</strong> and do not constitute financial advice.
              Past performance does not guarantee future results. Sports betting involves the risk of losing your principal.
              Please ensure sports betting is legal where you are, bet responsibly, and never wager more than you can afford.
              By subscribing you accept full responsibility for all betting decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div
        className="grid gap-5 max-w-3xl mx-auto"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}
      >

        {/* Monthly — featured */}
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ border: '1px solid rgba(0,229,255,0.35)' }}
        >
          {/* Gradient top accent */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, var(--cyan), var(--green))', backgroundSize: '200% auto', animation: 'gradient-flow 4s linear infinite' }} />

          {/* Recommended badge */}
          <div
            className="absolute top-0 right-5"
            style={{
              transform: 'translateY(-50%)',
              background: 'linear-gradient(135deg, var(--cyan), var(--green))',
              color: '#020617',
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.5px',
              padding: '3px 12px',
              borderRadius: 20,
              marginTop: 4,
            }}
          >
            BEST VALUE
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(0,229,255,0.07), rgba(0,255,136,0.04))',
              padding: '28px 28px 24px',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>
              {PLANS.monthly.name}
            </div>
            <div style={{ marginTop: 16, marginBottom: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--cyan)', lineHeight: 1 }}>
                NT${PLANS.monthly.price}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>/month</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              {PLANS.monthly.description}
            </p>
            <ul className="space-y-2.5 mb-6">
              {PLANS.monthly.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--green)', fontWeight: 800, fontSize: 12 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('monthly')}
              disabled={!!loading || !agreed}
              className="btn-primary w-full"
              style={{ justifyContent: 'center' }}
            >
              {loading === 'monthly' ? 'Processing…' : 'Subscribe Now'}
            </button>
          </div>
        </div>

        {/* Day Pass */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            border: '1px solid var(--border)',
            background: 'rgba(11,17,33,0.85)',
          }}
        >
          <div style={{ height: 3, background: 'var(--border)' }} />
          <div style={{ padding: '28px 28px 24px' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>
              {PLANS.day_pass.name}
            </div>
            <div style={{ marginTop: 16, marginBottom: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: 'var(--text-1)', lineHeight: 1 }}>
                NT${PLANS.day_pass.price}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-2)', marginLeft: 4 }}>/day</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              {PLANS.day_pass.description}
            </p>
            <ul className="space-y-2.5 mb-6">
              {PLANS.day_pass.features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 800, fontSize: 12 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('day_pass')}
              disabled={!!loading || !agreed}
              className="btn-ghost w-full"
              style={{ justifyContent: 'center' }}
            >
              {loading === 'day_pass' ? 'Processing…' : 'Buy Day Pass'}
            </button>
          </div>
        </div>
      </div>

      {/* Agreement */}
      <div className="max-w-3xl mx-auto mt-8">
        <label
          className="flex items-start gap-3 cursor-pointer p-4 rounded-2xl"
          style={{
            border: '1px solid var(--border)',
            background: 'rgba(11,17,33,0.6)',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              marginTop: 2,
              width: 20,
              height: 20,
              borderRadius: 6,
              border: `2px solid ${agreed ? 'var(--cyan)' : 'rgba(255,255,255,0.2)'}`,
              background: agreed ? 'rgba(0,229,255,0.15)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all .2s',
            }}
          >
            {agreed && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="sr-only" />
          <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
            I have read and agree to the{' '}
            <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>Disclaimer</span>
            {' '}above — predictions are for reference only, not financial advice. Sports betting involves financial risk and I accept full responsibility for all my wagering decisions.
          </span>
        </label>

        {!agreed && (
          <p className="text-center mt-3" style={{ fontSize: 12, color: 'var(--text-2)' }}>
            Please check the box above to enable checkout
          </p>
        )}
      </div>

      {/* Trust row */}
      <div
        className="flex flex-wrap items-center justify-center gap-6 mt-10"
        style={{ fontSize: 12, color: 'var(--text-2)' }}
      >
        {[
          { icon: '🔒', text: 'Secured by Stripe' },
          { icon: '🔄', text: 'Cancel anytime (monthly)' },
          { icon: '📊', text: '10+ AI models' },
          { icon: '⚡', text: 'Updated daily 2 PM TWN' },
        ].map(({ icon, text }) => (
          <span key={text} className="flex items-center gap-2">
            <span>{icon}</span>
            <span>{text}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
