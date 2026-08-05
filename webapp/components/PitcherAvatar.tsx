'use client'

import { useEffect, useState } from 'react'

const CDN_URL = (mlbId: number) =>
  `https://img.mlbstatic.com/mlb-photos/image/upload/` +
  `d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${mlbId}/headshot/67/current`

const SEARCH_URL = (name: string) =>
  `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(name)}` +
  `&sportId=1&fields=people,id,fullName,primaryPosition,active`

// module-level cache so we don't re-fetch the same pitcher across multiple cards
const photoCache = new Map<string, string | null>()

function initials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase()
}

export default function PitcherAvatar({ name, side }: { name?: string; side: 'left' | 'right' }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(name ? photoCache.get(name) ?? null : null)

  useEffect(() => {
    if (!name || name === 'TBD' || photoCache.has(name)) return
    let cancelled = false

    fetch(SEARCH_URL(name), { signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined })
      .then(r => r.json())
      .then(d => {
        const people = d?.people as Array<{ id: number; active?: boolean }> | undefined
        if (!people?.length) throw new Error('no match')
        const person = people.find(p => p.active) ?? people[0]
        const url = CDN_URL(person.id)
        photoCache.set(name, url)
        if (!cancelled) setPhotoUrl(url)
      })
      .catch(() => {
        photoCache.set(name, null)
      })

    return () => { cancelled = true }
  }, [name])

  const tone = side === 'left' ? 'var(--cyan)' : 'var(--green)'

  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: 6, flexShrink: 0, overflow: 'hidden',
        background: '#080f23', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setPhotoUrl(null)}
        />
      ) : (
        <span style={{ fontSize: 11, fontWeight: 800, color: tone }}>
          {name && name !== 'TBD' ? initials(name) : '??'}
        </span>
      )}
    </div>
  )
}
