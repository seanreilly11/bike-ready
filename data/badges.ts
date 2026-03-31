import type { Badge } from '@/types'

const badges: Badge[] = [
  {
    id:          'badge_priority',
    name:        'Priority Pro',
    emoji:       '⚡',
    description: 'Completed Priority Rules',
    moduleId:    'priority',
  },
  {
    id:          'badge_signs',
    name:        'Sign Reader',
    emoji:       '🪧',
    description: 'Completed Signs & Signals',
    moduleId:    'signs',
  },
  {
    id:          'badge_roadusers',
    name:        'Road Aware',
    emoji:       '🚶',
    description: 'Completed Road Users',
    moduleId:    'roadusers',
  },
  {
    id:          'badge_infra',
    name:        'Roundabout Ready',
    emoji:       '🔄',
    description: 'Completed Infrastructure',
    moduleId:    'infrastructure',
  },
  {
    id:          'badge_legal',
    name:        'Law Abiding',
    emoji:       '⚖️',
    description: 'Completed Legal Rules',
    moduleId:    'legal',
  },
  {
    id:          'badge_vocab',
    name:        'Dutch Speaker',
    emoji:       '🇳🇱',
    description: 'Completed Vocabulary',
    moduleId:    'vocabulary',
  },
  {
    id:          'badge_master',
    name:        'BikeReady',
    emoji:       '🏆',
    description: 'Completed all modules and passed the Test',
    moduleId:    null,
  },
]

export default badges
