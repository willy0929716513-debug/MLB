'use client'

import type { Pick } from '@/types'

interface PickCardProps {
  pick: Pick
}

const BET_LABEL: Record<string, string> = {
  '獨贏': 'ML',
  '讓分': 'RL',
  '大小分': 'TOT',
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  '💎 強注': { label: '💎 STRONG', color: '#FFB800', bg: 'rgba(255,184,0,0.1)' },
  '⭐ 穩定': { label: '⭐ SOLID',  color: '#00FF88', bg: 'rgba(0,255,136,0.1)' },
}

export default function PickCard({ pick }: PickCardProps) {
  const betShort  = (pick.btype && BET_LABEL[pick.btype]) || pick.btype || '???'
  const direction = pick.bet_label || ''
  const tierCfg   = (pick.tier ? TIER_CONFIG[pick.tier] : undefined) ?? {
    label: pick.tier ?? '', color: '#8892b0', bg: 'rgba(255,255,255,0.06)',
  }

  const edgeColor =
    pick.edge != null && pick.edge > 15 ? 'var(--green)' :
    pick.edge != null && pick.edge > 8  ? 'var(--cyan)'  : 'var(--yellow)'

  const confColor =
    pick.conf != null && pick.conf > 75 ? 'var(--green)' :
    pick.conf != null && pick.conf > 60 ? 'var(--cyan)'  : 'var(--text-2)'

  return (
    <div className="glass-card rounded-2xl overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div>
          {pick.tier && (
            <span className="badge" style={{ fontSize: 10, background: tierCfg.bg, color: tierCfg.color, border: `1px solid ${tierCfg.color}33` }}>
              {tierCfg.label}
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>
          {pick.game_time}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <TeamBlock abbr={pick.away} name={pick.away_cn} align="left" />
        <div className="flex flex-col items-center gap-1">
          <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 700, letterSpacing: '1px' }}>VS</span>
          <span style={{ fontSize: 10, color: 'var(--text-2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>AWAY</span>
        </div>
        <TeamBlock abbr={pick.home} name={pick.home_cn} align="right" />
      </div>

      {/* Pitchers */}
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        <PitcherInfo name={pick.away_sp} era={pick.away_era} align="left" />
        <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>SP</span>
        <PitcherInfo name={pick.home_sp} era={pick.home_era} align="right" />
      </div>

      {/* Prediction */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-cyan" style={{ fontSize: 11 }}>{betShort}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)' }}>{direction}</span>
          {pick.bp != null && (
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--green)' }}>@ {pick.bp.toFixed(2)}</span>
          )}
          {pick.bk && (
            <span className="badge badge-gray" style={{ fontSize: 9 }}>{pick.bk}</span>
          )}
        </div>

        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))' }}>
          {pick.edge != null && (
            <StatPill label="Edge" value={`+${pick.edge.toFixed(1)}%`} color={edgeColor} />
          )}
          {pick.conf != null && (
            <StatPill label="Confidence" value={`${pick.conf.toFixed(0)}%`} color={confColor} />
          )}
          {pick.stake != null && (
            <StatPill label="Kelly Stake" value={`$${pick.stake.toFixed(0)}`} color="var(--text-1)" />
          )}
        </div>
      </div>
    </div>
  )
}

function TeamBlock({ abbr, name, align }: { abbr: string; name: string; align: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'} gap-1`}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'rgba(0,229,255,0.07)', border: '1px solid rgba(0,229,255,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: 'var(--cyan)', letterSpacing: '-0.5px',
      }}>
        {abbr?.slice(0, 3).toUpperCase() || '???'}
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{name}</span>
    </div>
  )
}

function PitcherInfo({ name, era, align }: { name?: string; era?: number; align: 'left' | 'right' }) {
  return (
    <div className={`flex flex-col ${align === 'right' ? 'items-end' : 'items-start'}`}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{name || 'TBD'}</span>
      {era != null && (
        <span className="badge" style={{ fontSize: 9, marginTop: 2, background: 'rgba(0,229,255,0.06)', color: 'var(--cyan)', border: '1px solid rgba(0,229,255,0.12)', padding: '1px 5px' }}>
          ERA {era.toFixed(2)}
        </span>
      )}
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 15, fontWeight: 800, color }}>{value}</div>
    </div>
  )
}
