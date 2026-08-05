'use client'

import type { Stats } from '@/types'

export default function StatsBar({ stats }: { stats: Stats }) {
  const winRate = (stats.win_rate * 100).toFixed(1)
  const roi     = (stats.roi * 100).toFixed(1)
  const roiPlus = stats.roi >= 0 ? '+' : ''

  const byType = [
    { key: 'ML',  data: stats.by_type?.ML },
    { key: 'RL',  data: stats.by_type?.RL },
    { key: 'TOT', data: stats.by_type?.TOT },
  ].filter(t => t.data)

  return (
    <div className="space-y-4">

      {/* Section header */}
      <div className="flex items-center gap-3">
        <div style={{ width: 3, height: 20, background: 'var(--cyan)', borderRadius: 2 }} />
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Performance Dashboard
        </h2>
      </div>

      {/* Main stats grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}
      >
        <StatCard
          label="Win Rate"
          value={`${winRate}%`}
          sub={`${stats.wins}W / ${stats.settled - stats.wins}L`}
          color="var(--green)"
          icon="📈"
        />
        <StatCard
          label="Total ROI"
          value={`${roiPlus}${roi}%`}
          sub={`${stats.settled} settled picks`}
          color={stats.roi >= 0 ? 'var(--green)' : 'var(--red)'}
          icon="💰"
        />
        <StatCard
          label="Total Picks"
          value={String(stats.settled)}
          sub="all-time record"
          color="var(--cyan)"
          icon="⚾"
        />
        {stats.total_pnl != null && (
          <StatCard
            label="Total P&L"
            value={`${stats.total_pnl >= 0 ? '+' : ''}$${Math.round(stats.total_pnl)}`}
            sub="units profit"
            color={stats.total_pnl >= 0 ? 'var(--green)' : 'var(--red)'}
            icon="📊"
          />
        )}
      </div>

      {/* By-type breakdown */}
      {byType.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'rgba(11,17,33,0.8)' }}
        >
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Breakdown by Bet Type
            </span>
          </div>
          {byType.map(({ key, data }, idx) => data && (
            <div
              key={key}
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: idx < byType.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <div className="flex items-center gap-3">
                <span className="badge badge-cyan" style={{ fontSize: 10, minWidth: 36, justifyContent: 'center' }}>
                  {key}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {data.wins}W / {data.settled - data.wins}L
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>Win%</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: data.win_rate > 0.55 ? 'var(--green)' : 'var(--text-1)' }}>
                    {(data.win_rate * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>ROI</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: data.roi >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {data.roi >= 0 ? '+' : ''}{(data.roi * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label, value, sub, color, icon,
}: {
  label: string; value: string; sub: string; color: string; icon: string
}) {
  return (
    <div className="stat-widget" style={{ borderRadius: 16 }}>
      <div className="flex items-start justify-between">
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1, marginTop: 6 }}>
            {value}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
            {sub}
          </div>
        </div>
        <span style={{ fontSize: 22, opacity: 0.55 }}>{icon}</span>
      </div>
    </div>
  )
}
