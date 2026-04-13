import type { Badge } from '@/types'
import BadgeItem from './BadgeItem'

interface BadgeGridProps {
  badges:      Badge[]
  earnedIds:   Set<string>
  masteredIds?: Set<string>
}

export default function BadgeGrid({
  badges,
  earnedIds,
  masteredIds = new Set(),
}: BadgeGridProps) {
  return (
    <div>
      <h2 className="font-display font-bold text-lg text-stone-900 mb-3">Badges</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-1.5">
            <BadgeItem
              badge={badge}
              earned={earnedIds.has(badge.id)}
              mastered={masteredIds.has(badge.id)}
              size="md"
            />
            <p className="font-display font-bold text-xs text-stone-900 text-center leading-tight">
              {badge.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
