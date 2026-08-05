import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { isUnlocked, lockPicks } from '@/lib/entitlement'
import type { PicksData } from '@/types'

export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase.storage
      .from('picks')
      .download('picks_latest.json')

    if (error || !data) {
      return NextResponse.json({ error: 'No picks data' }, { status: 404 })
    }

    const picks = JSON.parse(await data.text()) as PicksData
    if (picks.picks?.length && !(await isUnlocked())) {
      picks.picks = lockPicks(picks.picks)
    }
    // Response varies per user (locked vs unlocked picks) — must not be
    // cached by shared/CDN caches, only ever by the requesting browser.
    return NextResponse.json(picks, {
      headers: {
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    console.error('picks route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
