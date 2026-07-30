import type { MetadataRoute } from "next";
import guides from "@/data/guides.json";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

// Static lastmod for pages without their own change date. Bump on meaningful
// content edits - never `new Date()`, which churns lastmod on every build.
// Google discounts lastmod site-wide once it catches the value lying, so a
// date that is merely old is safer than one that moves without the content.
const SITE_UPDATED = "2026-07-30";

// Legal pages change on their own schedule (operator details, policy edits),
// so they carry their own date rather than riding SITE_UPDATED.
const LEGAL_UPDATED = "2026-07-29";

// Sign photos surfaced to Google Images. "dutch road sign" queries are real
// expat search traffic and these are the only indexable images we own.
const SIGN_IMAGES = [
  "both_directions",
  "fietsstraat",
  "let_op",
  "mandatory_cycle",
  "motorized_only",
  "no_cycling",
  "no_parking",
  "priority_end",
  "priority_road",
  "uitgezonderd",
].map((name) => absoluteUrl(`/assets/signs/${name}.png`));

// `changeFrequency` and `priority` are deliberately omitted: Google ignores
// both, and they were only ever noise in the generated XML.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // No trailing slash - matches the canonical Next emits for `canonical: "/"`.
    { url: SITE_URL, lastModified: SITE_UPDATED },
    { url: `${SITE_URL}/learn`, lastModified: SITE_UPDATED },
    // /learn/[moduleId] is deliberately absent. Those are client-rendered,
    // gated session shells with no crawlable text - submitting them earns
    // "Crawled - currently not indexed" rows and teaches Google the sitemap
    // contains filler. The matching /guide/[moduleId] page is the indexable
    // version of the same topic.
    { url: `${SITE_URL}/guide`, lastModified: SITE_UPDATED },
    {
      url: `${SITE_URL}/guide/signs`,
      lastModified: SITE_UPDATED,
      images: SIGN_IMAGES,
    },
    { url: `${SITE_URL}/guide/glossary`, lastModified: SITE_UPDATED },
    ...guides.map((g) => ({
      url: `${SITE_URL}/guide/${g.moduleId}`,
      lastModified: g.updatedAt ?? SITE_UPDATED,
    })),
    ...["privacy", "terms", "cookies", "imprint"].map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: LEGAL_UPDATED,
    })),
  ];
}
