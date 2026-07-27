// Auto-links the first occurrence of each known glossary term in a string of
// guide prose. Pure transform: takes text in, returns React nodes out. The
// `seen` set is owned by the caller and shared across an entire page render so
// each term links at most once per page.

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { TERM_LINKS } from "@/lib/glossaryLinks";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// One combined matcher. Alternatives are pre-sorted longest-first in TERM_LINKS
// so multi-word phrases win over their substrings at the same position.
const TERM_PATTERN = new RegExp(
  `\\b(${TERM_LINKS.map((t) => escapeRegExp(t.term)).join("|")})\\b`,
  "gi",
);

const HREF_BY_TERM = new Map(
  TERM_LINKS.map((t) => [t.term.toLowerCase(), t.href] as const),
);

const LINK_CLASS =
  "text-stone-900 underline decoration-stone-300 underline-offset-2 hover:decoration-orange hover:text-orange transition-colors";

/**
 * Linkify the first unseen occurrence of each known glossary term in `text`.
 * Already-seen terms and non-matching text pass through untouched.
 */
export function linkifyTerms(text: string, seen: Set<string>): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  // Reset the stateful global regex before each scan.
  TERM_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TERM_PATTERN.exec(text)) !== null) {
    const matched = match[0];
    const termKey = matched.toLowerCase();
    const href = HREF_BY_TERM.get(termKey);

    // Unknown casing/term or already linked once on this page: leave as text.
    if (!href || seen.has(termKey)) continue;

    seen.add(termKey);
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={key++}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
    }
    nodes.push(
      <Link key={key++} href={href} className={LINK_CLASS}>
        {matched}
      </Link>,
    );
    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(lastIndex)}</Fragment>);
  }
  return nodes;
}
