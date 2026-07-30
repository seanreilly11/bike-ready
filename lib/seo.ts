// Server-safe SEO helpers: structured-data (JSON-LD) builders and URL resolution.
// No runtime deps. Keep schema objects plain so they JSON.stringify cleanly.

import type { FaqItem } from "@/types";

// Trailing slash stripped once here: every consumer concatenates (`${SITE_URL}
// /guide`), so a stray slash in the env var would emit `//guide` in the sitemap
// and robots.txt.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!.replace(/\/+$/, "");

/** Absolute URL from a site-relative path ("/guide/legal"). */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Open Graph fields the root layout sets. Next merges `metadata` shallowly, so
 * a page declaring its own `openGraph` REPLACES the root object and silently
 * loses these. Spread this into every page-level `openGraph`.
 */
export const OG_DEFAULTS = {
  siteName: "CycleDutch",
  locale: "en_GB",
} as const;

// Stable node ids so every page's graph points at ONE Organization instead of
// re-declaring an unlinked copy inside each Article's author/publisher.
export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Reference to the site-wide Organization node emitted by the root layout. */
const orgRef = { "@id": ORG_ID };

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "CycleDutch",
    url: SITE_URL,
    // Google rejects logos under 112x112 for the logo rich result, so this
    // points at the 180x180 apple-icon, never the 32x32 favicon.
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/apple-icon"),
      width: 180,
      height: 180,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "CycleDutch",
    url: SITE_URL,
    inLanguage: "en",
    publisher: orgRef,
  };
}

interface BreadcrumbItem {
  name: string;
  /** Site-relative path, e.g. "/guide/legal". */
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

interface ArticleInput {
  headline: string;
  description: string;
  /** Site-relative path of the article. */
  path: string;
  /** ISO date (YYYY-MM-DD). */
  datePublished?: string;
  dateModified?: string;
}

export function articleJsonLd({
  headline,
  description,
  path,
  datePublished,
  dateModified,
}: ArticleInput) {
  const url = absoluteUrl(path);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage: "en",
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author: orgRef,
    publisher: orgRef,
    isPartOf: { "@id": WEBSITE_ID },
  };
}

interface ProductInput {
  name: string;
  description: string;
  /** Decimal string, e.g. "9.99". */
  price: string;
  /** ISO 4217, e.g. "EUR". */
  currency: string;
  /** Site-relative path the offer is bought from. */
  path: string;
}

/**
 * One-time purchase of the full course. Only emit when the offer is actually
 * buyable - advertising a price for something not on sale is a misleading
 * commercial practice under NL/EU consumer law.
 */
export function productJsonLd({
  name,
  description,
  price,
  currency,
  path,
}: ProductInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    brand: orgRef,
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: currency,
      availability: "https://schema.org/InStock",
      url: absoluteUrl(path),
    },
  };
}

export function faqPageJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}

interface DefinedTerm {
  name: string;
  description: string;
  /** Site-relative anchor path, e.g. "/guide/glossary#haaientanden". */
  path: string;
}

export function definedTermSetJsonLd(
  name: string,
  description: string,
  terms: DefinedTerm[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name,
    description,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.name,
      description: t.description,
      url: absoluteUrl(t.path),
    })),
  };
}
