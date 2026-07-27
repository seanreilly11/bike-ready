import { Bike, Zap, Signpost, Footprints, RotateCw, Scale, Languages, Trophy } from 'lucide-react'
import type { Badge } from '@/types'

const badges: Badge[] = [
  {
    id:          'badge_fundamentals',
    name:        'Ready to Ride',
    icon:        Bike,
    description: 'Completed Fundamentals',
    moduleId:    'fundamentals',
  },
  {
    id:          'badge_priority',
    name:        'Priority Pro',
    icon:        Zap,
    description: 'Completed Priority Rules',
    moduleId:    'priority',
  },
  {
    id:          'badge_signs',
    name:        'Sign Reader',
    icon:        Signpost,
    description: 'Completed Signs & Signals',
    moduleId:    'signs',
  },
  {
    id:          'badge_roadusers',
    name:        'Road Aware',
    icon:        Footprints,
    description: 'Completed Road Users',
    moduleId:    'roadusers',
  },
  {
    id:          'badge_infra',
    name:        'Roundabout Ready',
    icon:        RotateCw,
    description: 'Completed Infrastructure',
    moduleId:    'infrastructure',
  },
  {
    id:          'badge_legal',
    name:        'Law Abiding',
    icon:        Scale,
    description: 'Completed Legal Rules',
    moduleId:    'legal',
  },
  {
    id:          'badge_vocab',
    name:        'Dutch Speaker',
    icon:        Languages,
    description: 'Completed Vocabulary',
    moduleId:    'vocabulary',
  },
  {
    id:          'badge_master',
    name:        'CycleDutch',
    icon:        Trophy,
    description: 'Passed the CycleDutch Test',
    moduleId:    null,
  },
]

export default badges
