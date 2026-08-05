import { createClient } from './supabase-server'
import type { Pick } from '@/types'

// Fields that require an active subscription to see; matches the Pick type's
// "null when locked" contract used by webapp/types/index.ts.
const LOCKED_FIELDS = ['btype', 'bet_label', 'bp', 'edge', 'conf', 'stake', 'bk'] as const

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

export async function isUnlocked(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Site owner/admin — always unlocked, no subscription needed.
  if (isAdminEmail(user.email)) return true

  const { data } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .limit(1)

  return !!data?.length
}

export function lockPicks(picks: Pick[]): Pick[] {
  return picks.map(pick => {
    const locked = { ...pick }
    for (const field of LOCKED_FIELDS) {
      locked[field] = null
    }
    return locked
  })
}
