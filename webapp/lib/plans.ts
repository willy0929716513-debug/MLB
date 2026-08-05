export const PLANS = {
  monthly: {
    name: '月訂閱',
    price: 299,
    description: '每月解鎖所有每日推薦',
    features: ['每日完整推薦', 'Edge% + 賠率 + 注額', '歷史勝率查詢', 'Discord 通知'],
  },
  day_pass: {
    name: '單日券',
    price: 79,
    description: '解鎖今日推薦，24小時有效',
    features: ['今日完整推薦', 'Edge% + 賠率 + 注額'],
  },
} as const

export type PlanKey = keyof typeof PLANS
