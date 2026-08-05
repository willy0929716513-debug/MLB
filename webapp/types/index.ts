export interface Pick {
  home: string
  away: string
  home_cn: string
  away_cn: string
  btype: string | null   // "獨贏" | "讓分" | "大小分" — null when locked
  bet_label: string | null  // "" | "+1.5" | "-1.5" | "OVER" | "UNDER" — null when locked
  bp: number | null   // best price (decimal odds) — null when locked
  edge: number | null // edge % (already percentage, e.g. 17.3) — null when locked
  conf: number | null // confidence % (already percentage, e.g. 79.0) — null when locked
  stake: number | null
  game_date: string
  game_time: string
  home_sp: string
  away_sp: string
  home_era?: number
  away_era?: number
  home_k9?: number
  away_k9?: number
  model_p?: number | null
  bk: string | null   // bookmaker — null when locked
  tier: string        // "⭐ 穩定" | "💎 強注"
}

export interface Stats {
  settled: number
  wins: number
  win_rate: number       // already a percentage, e.g. 71.5 means 71.5% — do not multiply by 100
  total_in?: number
  total_pnl: number
  roi: number | null      // already a percentage; null when no stake has settled yet
  by_type: {
    ML?: TypeStat
    RL?: TypeStat
    TOT?: TypeStat
  }
}

export interface TypeStat {
  settled: number
  wins: number
  win_rate: number        // already a percentage
  roi: number | null       // already a percentage; null when total stake is 0
}

export interface HistoryRecord {
  date: string
  home: string
  away: string
  home_cn: string
  away_cn: string
  bet_type: string
  label: string
  price: number
  stake: number
  edge: number
  result: 'W' | 'L' | 'P' | null
}

export interface HistoryTrendPoint {
  date: string
  settled: number
  win_rate: number
  roi: number
}

export interface PicksData {
  picks: Pick[]
  stats: Stats
  recent_history: HistoryRecord[]
  history_trend?: HistoryTrendPoint[]
  generated_at: string
  date: string
}

export interface Subscription {
  plan_type: 'monthly' | 'day_pass'
  status: 'active' | 'expired' | 'cancelled'
  expires_at: string
}
