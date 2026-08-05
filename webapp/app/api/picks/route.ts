import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export const revalidate = 1800 // cache for 30 minutes; picks update once daily

export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase.storage
      .from('picks')
      .download('picks_latest.json')

    if (error || !data) {
      return NextResponse.json({ error: 'No picks data' }, { status: 404 })
    }

    const picks = JSON.parse(await data.text())
    return NextResponse.json(picks, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
      },
    })
  } catch (e) {
    console.error('picks route error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
