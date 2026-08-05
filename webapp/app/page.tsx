import HeroSection from '@/components/HeroSection'
import PickCard from '@/components/PickCard'
import StatsBar from '@/components/StatsBar'
import { createServiceClient } from '@/lib/supabase-server'
import type { PicksData } from '@/types'

export const revalidate = 1800 // re-fetch from Supabase every 30 min; picks update once daily

async function fetchPicks(): Promise<PicksData | null> {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase.storage
      .from('picks')
      .download('picks_latest.json')
    if (error || !data) return null
    return JSON.parse(await data.text()) as PicksData
  } catch {
    return null
  }
}

export default async function HomePage() {
  const data = await fetchPicks()

  return (
    <>
      <HeroSection stats={data?.stats ?? null} />

      <div id="predictions" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Disclaimer */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)' }}
        >
          <div className="flex items-start gap-3">
            <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>
                Disclaimer / 免責聲明
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
                Predictions are <strong style={{ color: 'var(--text-1)' }}>for reference only</strong> and do not constitute financial advice.
                Past performance does not guarantee future results. Sports betting involves the risk of losing your principal.
                Please confirm that sports betting is legal in your region and never wager more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {data?.stats && <StatsBar stats={data.stats} />}

        {/* Today's picks */}
        <section>
          <SectionHeader
            title="Today's Predictions"
            sub={data?.date ? `Games for ${data.date}` : undefined}
            generated={data?.generated_at}
          />

          {data?.picks?.length ? (
            <div
              className="grid gap-4 mt-5"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}
            >
              {data.picks.map((pick, i) => (
                <PickCard key={i} pick={pick} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="⚾"
              title="No predictions yet"
              desc="Our AI runs daily analysis at 2 PM Taiwan time. Check back soon."
            />
          )}
        </section>

        {/* Recent history */}
        {data?.recent_history?.length ? (
          <section>
            <SectionHeader title="Recent Performance" sub="Last settled picks" />

            {/* Desktop table */}
            <div className="mt-5 rounded-2xl overflow-hidden hidden sm:block" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(11,17,33,0.9)', borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Matchup', 'Bet', 'Odds', 'Result'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', fontSize: 10, fontWeight: 800,
                        color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.8px',
                        textAlign: h === 'Odds' || h === 'Result' ? 'right' : 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recent_history.map((r, i) => (
                    <tr
                      key={i}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{r.date}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-1)' }}>
                        {r.away_cn} <span style={{ color: 'var(--text-2)' }}>@</span> {r.home_cn}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-cyan" style={{ fontSize: 9 }}>{r.bet_type}</span>
                        {' '}
                        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-1)', textAlign: 'right' }}>
                        {r.price?.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <ResultBadge result={r.result} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden mt-4 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {data.recent_history.map((r, i) => (
                <div key={i} className="px-4 py-4 space-y-2" style={{ borderBottom: i < data.recent_history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>
                      {r.away_cn} @ {r.home_cn}
                    </span>
                    <ResultBadge result={r.result} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{r.date}</span>
                    <span className="badge badge-cyan" style={{ fontSize: 9 }}>{r.bet_type}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>@ {r.price?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

      </div>
    </>
  )
}

function SectionHeader({ title, sub, generated }: { title: string; sub?: string; generated?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
      <div>
        <div className="flex items-center gap-3">
          <div style={{ width: 3, height: 22, background: 'var(--cyan)', borderRadius: 2 }} />
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)' }}>{title}</h2>
        </div>
        {sub && <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4, marginLeft: 15 }}>{sub}</p>}
      </div>
      {generated && (
        <p style={{ fontSize: 11, color: 'var(--text-2)' }}>Updated {generated}</p>
      )}
    </div>
  )
}

function ResultBadge({ result }: { result: string | null }) {
  if (result === 'W') return <span className="badge badge-green" style={{ fontSize: 10 }}>✓ WIN</span>
  if (result === 'L') return <span className="badge badge-red"   style={{ fontSize: 10 }}>✗ LOSS</span>
  if (result === 'P') return <span className="badge badge-yellow" style={{ fontSize: 10 }}>― PUSH</span>
  return <span className="badge badge-gray" style={{ fontSize: 10 }}>PENDING</span>
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl mt-5" style={{ border: '1px dashed var(--border)' }}>
      <span style={{ fontSize: 48, opacity: 0.4 }}>{icon}</span>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginTop: 12 }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, maxWidth: 300 }}>{desc}</p>
    </div>
  )
}
