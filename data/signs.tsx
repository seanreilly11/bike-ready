import type { SignId } from '@/types'

// ---------------------------------------------------------------------------
// Individual SVG sign components
// Each is a zero-prop React component returning a sized SVG.
// ---------------------------------------------------------------------------

function SignMandatoryCycle() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mandatory cycle path (G11)">
      <circle cx="40" cy="40" r="38" fill="#1A73E8" />
      <circle cx="40" cy="40" r="36" fill="#1A73E8" stroke="white" strokeWidth="2" />
      {/* Bicycle wheels */}
      <circle cx="27" cy="50" r="9" fill="none" stroke="white" strokeWidth="3" />
      <circle cx="53" cy="50" r="9" fill="none" stroke="white" strokeWidth="3" />
      {/* Frame */}
      <path d="M27 50 L37 30 L53 50" stroke="white" strokeWidth="3" fill="none" strokeLinejoin="round" />
      <path d="M37 30 L45 50" stroke="white" strokeWidth="3" />
      {/* Handlebars */}
      <path d="M46 30 L52 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
      {/* Seat */}
      <path d="M33 30 L41 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
      {/* Rider head */}
      <circle cx="48" cy="26" r="4" fill="white" />
    </svg>
  )
}

function SignNoCycling() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="No cycling sign">
      <circle cx="40" cy="40" r="38" fill="white" />
      <circle cx="40" cy="40" r="38" fill="none" stroke="#D32F2F" strokeWidth="5" />
      {/* Bicycle silhouette */}
      <circle cx="27" cy="48" r="9" fill="none" stroke="#555" strokeWidth="2.5" />
      <circle cx="53" cy="48" r="9" fill="none" stroke="#555" strokeWidth="2.5" />
      <path d="M27 48 L36 28 L53 48" stroke="#555" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <path d="M36 28 L44 48" stroke="#555" strokeWidth="2.5" />
      <path d="M44 28 L50 28" stroke="#555" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="46" cy="24" r="3.5" fill="#555" />
      {/* Red diagonal bar */}
      <line x1="16" y1="64" x2="64" y2="16" stroke="#D32F2F" strokeWidth="6" strokeLinecap="round" />
    </svg>
  )
}

function SignPriorityRoad() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Priority road (voorrangsweg)">
      {/* Yellow diamond */}
      <path d="M40 4 L76 40 L40 76 L4 40 Z" fill="#FFD600" />
      {/* White inner diamond */}
      <path d="M40 16 L64 40 L40 64 L16 40 Z" fill="white" />
    </svg>
  )
}

function SignUitgezonderd() {
  return (
    <svg width="80" height="100" viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="No entry except cyclists (uitgezonderd fietsers)">
      {/* Main no-entry sign */}
      <circle cx="40" cy="36" r="34" fill="#D32F2F" />
      <rect x="16" y="32" width="48" height="8" rx="4" fill="white" />
      {/* Sub-sign: uitgezonderd fietsers */}
      <rect x="10" y="72" width="60" height="24" rx="4" fill="white" stroke="#888" strokeWidth="1.5" />
      <text x="40" y="80" textAnchor="middle" fontSize="6" fill="#333" fontFamily="sans-serif" fontWeight="bold">UITGE-</text>
      <text x="40" y="88" textAnchor="middle" fontSize="6" fill="#333" fontFamily="sans-serif" fontWeight="bold">ZONDERD</text>
      {/* Small bicycle icon */}
      <circle cx="31" cy="92" r="3" fill="none" stroke="#333" strokeWidth="1" />
      <circle cx="43" cy="92" r="3" fill="none" stroke="#333" strokeWidth="1" />
      <path d="M31 92 L36 84 L43 92" stroke="#333" strokeWidth="1" fill="none" />
    </svg>
  )
}

function SignFietsstraat() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Fietsstraat sign">
      {/* Red rectangular background */}
      <rect x="2" y="2" width="76" height="56" rx="6" fill="#D32F2F" />
      {/* White text */}
      <text x="40" y="28" textAnchor="middle" fontSize="13" fill="white" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1">FIETS</text>
      <text x="40" y="48" textAnchor="middle" fontSize="13" fill="white" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1">STRAAT</text>
    </svg>
  )
}

function SignCyclistLight() {
  return (
    <svg width="60" height="100" viewBox="0 0 60 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Cyclist traffic light (red)">
      {/* Light housing */}
      <rect x="10" y="4" width="40" height="82" rx="8" fill="#222" />
      {/* Red light — active */}
      <circle cx="30" cy="24" r="12" fill="#D32F2F" />
      <circle cx="30" cy="24" r="10" fill="#FF5252" />
      {/* Orange light */}
      <circle cx="30" cy="50" r="12" fill="#333" />
      <circle cx="30" cy="50" r="9" fill="#444" />
      {/* Green light */}
      <circle cx="30" cy="74" r="12" fill="#333" />
      <circle cx="30" cy="74" r="9" fill="#444" />
      {/* Bicycle symbol on red light */}
      <circle cx="26" cy="26" r="3" fill="none" stroke="white" strokeWidth="1.2" />
      <circle cx="34" cy="26" r="3" fill="none" stroke="white" strokeWidth="1.2" />
      <path d="M26 26 L29 21 L34 26" stroke="white" strokeWidth="1.2" fill="none" />
      {/* Post */}
      <rect x="27" y="86" width="6" height="12" fill="#888" />
    </svg>
  )
}

function SignSharkTeeth() {
  return (
    <svg width="120" height="50" viewBox="0 0 120 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Shark teeth road marking (haaientanden)">
      {/* Road surface */}
      <rect width="120" height="50" fill="#888" rx="4" />
      {/* Three white triangles pointing right (yield direction) */}
      <polygon points="10,10 10,40 35,25" fill="white" />
      <polygon points="45,10 45,40 70,25" fill="white" />
      <polygon points="80,10 80,40 105,25" fill="white" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Registry — lookup by SignId
// ---------------------------------------------------------------------------

export const SIGN_REGISTRY: Record<SignId, React.FC> = {
  mandatory_cycle: SignMandatoryCycle,
  no_cycling:      SignNoCycling,
  priority_road:   SignPriorityRoad,
  uitgezonderd:    SignUitgezonderd,
  fietsstraat:     SignFietsstraat,
  cyclist_light:   SignCyclistLight,
  shark_teeth:     SignSharkTeeth,
}
