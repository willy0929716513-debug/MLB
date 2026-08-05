'use client'

import { useState } from 'react'
import PickCard from './PickCard'
import PaywallModal from './PaywallModal'
import type { Pick } from '@/types'

export default function PicksGrid({ picks, locked }: { picks: Pick[]; locked: boolean }) {
  const [showPaywall, setShowPaywall] = useState(false)

  return (
    <>
      {locked && (
        <button
          onClick={() => setShowPaywall(true)}
          className="w-full flex items-center justify-between gap-3 rounded-2xl px-5 py-4 mt-5"
          style={{
            background: 'linear-gradient(135deg, rgba(0,229,255,0.1), rgba(0,255,136,0.06))',
            border: '1px solid rgba(0,229,255,0.3)',
            cursor: 'pointer',
          }}
        >
          <span className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            🔒 Unlock edge %, confidence & Kelly stake for every pick
          </span>
          <span className="badge badge-cyan" style={{ fontSize: 11, flexShrink: 0 }}>Unlock →</span>
        </button>
      )}

      <div
        className="grid gap-4 mt-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}
      >
        {picks.map((pick, i) => (
          <PickCard key={i} pick={pick} locked={locked} onUnlock={() => setShowPaywall(true)} />
        ))}
      </div>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
    </>
  )
}
