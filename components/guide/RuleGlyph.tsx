import type { ReactNode } from "react";
import { signColors } from "@/lib/tokens";

/**
 * Abstract diagrams for the "how to read any sign" rules. These illustrate the
 * grammar (shape, colour, sash), never a specific sign - real signs are photos.
 */
const glyphs: Record<string, ReactNode> = {
  shape_circle: (
    <>
      <circle cx="14" cy="20" r="10" fill={signColors.blue} />
      <circle
        cx="30"
        cy="20"
        r="9"
        fill={signColors.white}
        stroke={signColors.red}
        strokeWidth="3.5"
      />
    </>
  ),
  shape_triangle: (
    <path
      d="M20 5 L36 32 H4 Z"
      fill={signColors.white}
      stroke={signColors.red}
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
  ),
  shape_rectangle: (
    <>
      <rect
        x="5"
        y="9"
        width="30"
        height="22"
        rx="2"
        fill={signColors.blue}
      />
      <rect x="10" y="15" width="20" height="4" rx="1" fill={signColors.white} />
      <rect x="10" y="22" width="13" height="4" rx="1" fill={signColors.white} />
    </>
  ),
  shape_diamond: (
    <>
      <rect
        x="6"
        y="6"
        width="28"
        height="28"
        rx="3"
        transform="rotate(45 20 20)"
        fill={signColors.white}
        stroke={signColors.outline}
        strokeWidth="2"
      />
      <rect
        x="11"
        y="11"
        width="18"
        height="18"
        rx="2"
        transform="rotate(45 20 20)"
        fill={signColors.yellow}
      />
    </>
  ),
  colour_blue: (
    <>
      <circle cx="20" cy="20" r="14" fill={signColors.blue} />
      <path
        d="M20 12 v16 M14 22 l6 6 6-6"
        fill="none"
        stroke={signColors.white}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  colour_red_border: (
    <circle
      cx="20"
      cy="20"
      r="13"
      fill={signColors.white}
      stroke={signColors.red}
      strokeWidth="5"
    />
  ),
  colour_red_bar: (
    <>
      <circle cx="20" cy="20" r="14" fill={signColors.red} />
      <rect x="8" y="17" width="24" height="6" rx="1" fill={signColors.white} />
    </>
  ),
  sash_red: (
    <>
      <circle
        cx="20"
        cy="20"
        r="13"
        fill={signColors.white}
        stroke={signColors.red}
        strokeWidth="3.5"
      />
      <path
        d="M11 29 L29 11"
        stroke={signColors.red}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </>
  ),
  sash_grey: (
    <>
      <rect
        x="6"
        y="6"
        width="28"
        height="28"
        rx="3"
        transform="rotate(45 20 20)"
        fill={signColors.white}
        stroke={signColors.outline}
        strokeWidth="2"
      />
      <rect
        x="11"
        y="11"
        width="18"
        height="18"
        rx="2"
        transform="rotate(45 20 20)"
        fill={signColors.yellow}
      />
      <path
        d="M9 27 L27 9 M13 31 L31 13"
        stroke={signColors.grey}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  ),
  sub_signs: (
    <>
      <circle
        cx="20"
        cy="15"
        r="10"
        fill={signColors.white}
        stroke={signColors.red}
        strokeWidth="3.5"
      />
      <rect
        x="7"
        y="28"
        width="26"
        height="8"
        rx="1.5"
        fill={signColors.white}
        stroke={signColors.outline}
        strokeWidth="1.5"
      />
      <rect x="10" y="31" width="14" height="2.5" rx="1" fill={signColors.grey} />
    </>
  ),
};

interface RuleGlyphProps {
  ruleId: string;
  className?: string;
}

export default function RuleGlyph({ ruleId, className = "" }: RuleGlyphProps) {
  const glyph = glyphs[ruleId];
  if (!glyph) return null;

  return (
    <svg
      viewBox="0 0 40 40"
      className={`w-10 h-10 flex-shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {glyph}
    </svg>
  );
}
