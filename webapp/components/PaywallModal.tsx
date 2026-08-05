'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLANS } from '@/lib/plans'

export default function PaywallModal({ onClose }: { onClose: () => void }) {
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
        router.push('/login?next=pricing')
      }
    } catch {
      alert('Checkout error — please try again')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="glass-card rounded-3xl relative w-full overflow-hidden"
        style={{ maxWidth: 480 }}
      >
        {/* Neon accent bar */}
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg, var(--cyan), var(--green), var(--cyan))',
            backgroundSize: '200% auto',
            animation: 'gradient-flow 4s linear infinite',
          }}
        />

        <div className="p-6 sm:p-8">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 flex items-center justify-center rounded-xl"
            style={{
              width: 36, height: 36,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-2)',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all .2s',
            }}
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(0,229,255,0.1)',
                border: '1px solid rgba(0,229,255,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                margin: '0 auto 14px',
              }}
            >
              ⚾
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>
              Unlock Full Predictions
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>
              Choose a plan to access every pick with edge, confidence & Kelly stake
            </p>
          </div>

          {/* Plans */}
          <div className="space-y-3">
            <PlanButton
              plan="monthly"
              name={PLANS.monthly.name}
              desc={PLANS.monthly.description}
              price={PLANS.monthly.price}
              unit="/mo"
              features={PLANS.monthly.features}
              featured
              loading={loading === 'monthly'}
              disabled={!!loading || !agreed}
              onClick={() => handleCheckout('monthly')}
            />
            <PlanButton
              plan="day_pass"
              name={PLANS.day_pass.name}
              desc={PLANS.day_pass.description}
              price={PLANS.day_pass.price}
              unit="/day"
              features={PLANS.day_pass.features}
              loading={loading === 'day_pass'}
              disabled={!!loading || !agreed}
              onClick={() => handleCheckout('day_pass')}
            />
          </div>

          {/* Agreement checkbox */}
          <label
            className="flex items-start gap-3 mt-5 cursor-pointer"
            style={{ userSelect: 'none' }}
          >
            <div
              style={{
                marginTop: 2,
                width: 18,
                height: 18,
                borderRadius: 5,
                border: `2px solid ${agreed ? 'var(--cyan)' : 'rgba(255,255,255,0.2)'}`,
                background: agreed ? 'rgba(0,229,255,0.15)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all .2s',
                cursor: 'pointer',
              }}
            >
              {agreed && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="sr-only"
            />
            <span style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
              I have read and agree to the{' '}
              <span style={{ color: 'var(--text-1)' }}>Disclaimer</span>
              {' '}— predictions are for reference only, not financial advice. Sports betting involves financial risk and I accept full responsibility for my own decisions.
            </span>
          </label>

          {/* Footer */}
          <p
            className="text-center mt-4"
            style={{ fontSize: 11, color: 'var(--text-2)' }}
          >
            🔒 Secured by Stripe · Cancel monthly anytime
          </p>
        </div>
      </div>
    </div>
  )
}

function PlanButton({
  name, desc, price, unit, features, featured, loading, disabled, onClick,
}: {
  plan: string; name: string; desc: string; price: number; unit: string
  features: readonly string[]; featured?: boolean; loading: boolean
  disabled: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left rounded-2xl p-4 transition-all duration-200"
      style={{
        background: featured
          ? 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(0,255,136,0.06))'
          : 'rgba(255,255,255,0.03)',
        border: featured
          ? '1px solid rgba(0,229,255,0.3)'
          : '1px solid rgba(255,255,255,0.1)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        minHeight: 48,
      }}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>
              {name}
            </span>
            {featured && (
              <span className="badge badge-cyan" style={{ fontSize: 9 }}>Best Value</span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{desc}</p>
          <ul className="mt-2 space-y-0.5">
            {features.map(f => (
              <li key={f} style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--green)', fontSize: 10 }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div style={{ fontSize: 24, fontWeight: 800, color: featured ? 'var(--cyan)' : 'var(--text-1)' }}>
            NT${price}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{unit}</div>
          {loading && (
            <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 4 }}>Processing…</div>
          )}
        </div>
      </div>
    </button>
  )
}
