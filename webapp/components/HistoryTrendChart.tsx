'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HistoryTrendPoint } from '@/types'

const CYAN = '#00E5FF'
const GREEN = '#00FF88'
const RED = '#FF3366'

function shortDate(d: string) {
  const parts = d.split('-')
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : d
}

function TrendTooltip({ active, payload, suffix }: { active?: boolean; payload?: Array<{ value: number; payload: HistoryTrendPoint }>; suffix: string }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div
      className="glass-card rounded-lg"
      style={{ padding: '8px 12px', fontSize: 12, border: '1px solid var(--border-hi)' }}
    >
      <div style={{ color: 'var(--text-2)', marginBottom: 2 }}>{p.date}</div>
      <div style={{ color: 'var(--text-1)', fontWeight: 700 }}>
        {payload[0].value.toFixed(1)}{suffix}
        <span style={{ color: 'var(--text-2)', fontWeight: 400, marginLeft: 6 }}>({p.settled} 場)</span>
      </div>
    </div>
  )
}

function MiniTrend({
  data, dataKey, label, value, color, suffix,
}: {
  data: HistoryTrendPoint[]; dataKey: 'win_rate' | 'roi'; label: string
  value: string; color: string; suffix: string
}) {
  return (
    <div className="glass-card rounded-2xl p-4" style={{ minWidth: 0 }}>
      <div className="flex items-baseline justify-between mb-1">
        <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
        <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ width: '100%', height: 90 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 10, fill: 'var(--text-2)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip content={<TrendTooltip suffix={suffix} />} cursor={{ stroke: 'var(--border-hi)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={data.length <= 1 ? { r: 3, strokeWidth: 0, fill: color } : false}
              activeDot={{ r: 4, strokeWidth: 0, fill: color }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default function HistoryTrendCharts({ data }: { data: HistoryTrendPoint[] }) {
  if (!data?.length) return null

  const latest = data[data.length - 1]
  const roiColor = latest.roi >= 0 ? GREEN : RED

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <MiniTrend
        data={data}
        dataKey="win_rate"
        label="Win Rate Trend"
        value={`${latest.win_rate.toFixed(1)}%`}
        color={CYAN}
        suffix="%"
      />
      <MiniTrend
        data={data}
        dataKey="roi"
        label="ROI Trend"
        value={`${latest.roi >= 0 ? '+' : ''}${latest.roi.toFixed(1)}%`}
        color={roiColor}
        suffix="%"
      />
    </div>
  )
}
