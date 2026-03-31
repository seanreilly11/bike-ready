import type { Badge } from '@/types'
import BadgeItem from './BadgeItem'

interface BadgeGridProps {
  badges:    Badge[]
  earnedIds: Set<string>
}

export default function BadgeGrid({ badges, earnedIds }: BadgeGridProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-lg text-stone-900 mb-3">Badges</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {badges.map(badge => (
          <BadgeItem
            key={badge.id}
            badge={badge}
            earned={earnedIds.has(badge.id)}
          />
        ))}
      </div>
    </div>
  )
}
