import type { Module } from '@/types'

const modules: Module[] = [
  {
    id:          'priority',
    title:       'Priority Rules',
    emoji:       '⚡',
    description: 'Who goes first — and how to know before it matters.',
    badgeId:     'badge_priority',
    badgeName:   'Priority Pro',
  },
  {
    id:          'signs',
    title:       'Signs & Signals',
    emoji:       '🪧',
    description: 'Read the signs that keep you out of trouble.',
    badgeId:     'badge_signs',
    badgeName:   'Sign Reader',
  },
  {
    id:          'roadusers',
    title:       'Road Users',
    emoji:       '🚶',
    description: 'Trams, pedestrians, and everyone else sharing the road.',
    badgeId:     'badge_roadusers',
    badgeName:   'Road Aware',
  },
  {
    id:          'infrastructure',
    title:       'Infrastructure',
    emoji:       '🔄',
    description: 'Roundabouts, cycle paths, and city cycling rules.',
    badgeId:     'badge_infra',
    badgeName:   'Roundabout Ready',
  },
  {
    id:          'legal',
    title:       'Legal Rules',
    emoji:       '⚖️',
    description: 'The laws that apply to cyclists — and the fines if you miss them.',
    badgeId:     'badge_legal',
    badgeName:   'Law Abiding',
  },
  {
    id:          'vocabulary',
    title:       'Vocabulary',
    emoji:       '🇳🇱',
    description: 'The Dutch words you\'ll see on roads and signs.',
    badgeId:     'badge_vocab',
    badgeName:   'Dutch Speaker',
  },
]

export default modules
