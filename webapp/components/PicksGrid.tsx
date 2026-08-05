import PickCard from './PickCard'
import type { Pick } from '@/types'

export default function PicksGrid({ picks }: { picks: Pick[] }) {
  return (
    <div
      className="grid gap-4 mt-5"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}
    >
      {picks.map((pick, i) => (
        <PickCard key={i} pick={pick} />
      ))}
    </div>
  )
}
