import { Bike, Zap, Signpost, Footprints, RotateCw, Scale, Languages } from 'lucide-react'
import type { Module } from '@/types'

const modules: Module[] = [
  {
    id:          'fundamentals',
    title:       'Fundamentals',
    icon:        Bike,
    description: 'The essential rules every cyclist in the Netherlands needs to know before anything else.',
    badgeId:     'badge_fundamentals',
    badgeName:   'Ready to Ride',
    alwaysFree:  true,
  },
  {
    id:          'priority',
    title:       'Priority Rules',
    icon:        Zap,
    description: 'Who goes first — and how to know before it matters.',
    badgeId:     'badge_priority',
    badgeName:   'Priority Pro',
    alwaysFree:  false,
  },
  {
    id:          'signs',
    title:       'Signs & Signals',
    icon:        Signpost,
    description: 'Read the signs that keep you out of trouble.',
    badgeId:     'badge_signs',
    badgeName:   'Sign Reader',
    alwaysFree:  false,
  },
  {
    id:          'roadusers',
    title:       'Road Users',
    icon:        Footprints,
    description: 'Trams, pedestrians, and everyone else sharing the road.',
    badgeId:     'badge_roadusers',
    badgeName:   'Road Aware',
    alwaysFree:  false,
  },
  {
    id:          'infrastructure',
    title:       'Infrastructure',
    icon:        RotateCw,
    description: 'Roundabouts, cycle paths, and city cycling rules.',
    badgeId:     'badge_infra',
    badgeName:   'Roundabout Ready',
    alwaysFree:  false,
  },
  {
    id:          'legal',
    title:       'Legal Rules',
    icon:        Scale,
    description: 'The laws that apply to cyclists — and the fines if you miss them.',
    badgeId:     'badge_legal',
    badgeName:   'Law Abiding',
    alwaysFree:  false,
  },
  {
    id:          'vocabulary',
    title:       'Vocabulary',
    icon:        Languages,
    description: 'The Dutch words you\'ll see on roads and signs.',
    badgeId:     'badge_vocab',
    badgeName:   'Dutch Speaker',
    alwaysFree:  false,
  },
]

export default modules
