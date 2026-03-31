// Design tokens — single source of truth for all colour and font values.
// Used both here (for programmatic access) and mirrored in app/globals.css
// via @theme for Tailwind v4 utility generation.

export const colors = {
  // Primary accent
  orange:      '#E8500A',
  orangeLight: '#FDF0E8',
  orangeMid:   '#FAD5B8',

  // Page backgrounds and surfaces
  stone50:  '#FAFAF8',
  stone100: '#F4F2EE',
  stone200: '#E8E4DC',
  stone400: '#A89D8C',
  stone600: '#6B6055',
  stone900: '#1C1915',

  // Correct states
  green:      '#4ade80',
  greenLight: '#f0fdf4',
  greenMid:   '#bbf7d0',
  greenDark:  '#166534',

  // Incorrect / needs-work states
  red:      '#f87171',
  redLight: '#fef2f2',
  redMid:   '#fecaca',
  redDark:  '#991b1b',

  // Badge states
  yellow:      '#fde68a',
  yellowLight: '#fef9c3',
  yellowDark:  '#854d0e',
} as const

export const fonts = {
  display: ['Bricolage Grotesque', 'sans-serif'],
  mono:    ['DM Mono', 'monospace'],
} as const
