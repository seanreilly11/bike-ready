// Maps high-value Dutch terms appearing in guide prose to their glossary
// definitions, so body text auto-links to /guide/glossary. Server-safe, no
// runtime deps — the registry is derived from glossary.json at build time.

import glossary from "@/data/glossary.json";

// Anchor must match the id generated in GlossaryContent.tsx and the glossary
// page's term anchors: term.replace(/\s+/g, "-").toLowerCase().
export function glossaryAnchor(term: string): string {
  return term.replace(/\s+/g, "-").toLowerCase();
}

// Curated allowlist of high-value, unambiguous Dutch terms to auto-link from
// guide body prose. Short or common words (weg, rechts, rem, wind) are
// deliberately excluded to avoid noisy over-linking. Each entry must exactly
// match a `term` in glossary.json — enforced by glossaryLinks.test.ts.
export const LINKABLE_TERMS: readonly string[] = [
  "voorrang verlenen",
  "voorrangsweg",
  "haaientanden",
  "fietsstraat",
  "fietspad",
  "rijwielpad",
  "auto te gast",
  "speed pedelec",
  "uitgezonderd",
  "bestemmingsverkeer",
  "woonerf",
  "zone 30",
  "voetgangersoversteekplaats",
  "eenrichtingsverkeer",
  "inhalen verboden",
  "verboden in te rijden",
  "stalling",
];

const allGlossaryTerms = new Set(
  glossary.categories.flatMap((c) => c.terms.map((t) => t.term)),
);

export interface TermLink {
  term: string;
  href: string;
}

// Sorted longest-first so multi-word phrases win over their substrings during
// matching (e.g. "voorrang verlenen" is tried before "voorrang").
export const TERM_LINKS: readonly TermLink[] = LINKABLE_TERMS.filter((t) =>
  allGlossaryTerms.has(t),
)
  .map((t) => ({ term: t, href: `/guide/glossary#${glossaryAnchor(t)}` }))
  .sort((a, b) => b.term.length - a.term.length);
