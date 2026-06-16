// Server-safe SEO helpers: structured-data (JSON-LD) builders and URL resolution.
// No runtime deps. Keep schema objects plain so they JSON.stringify cleanly.

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bikeready.nl";

/** Absolute URL from a site-relative path ("/guide/legal"). */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
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
    author: { "@type": "Organization", name: "BikeReady", url: SITE_URL },
    publisher: { "@type": "Organization", name: "BikeReady", url: SITE_URL },
  };
}

interface FaqItem {
  q: string;
  a: string;
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
