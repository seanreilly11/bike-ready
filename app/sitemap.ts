import type { MetadataRoute } from "next";
import guides from "@/data/guides.json";
import modules from "@/data/modules";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

// Static lastmod for pages without their own change date. Bump on meaningful
// content edits - never `new Date()`, which churns lastmod on every build.
const SITE_UPDATED = "2026-06-13";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/learn`,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Client-rendered session shells - little crawlable text, so low priority.
    ...modules.map((mod) => ({
      url: `${BASE_URL}/learn/${mod.id}`,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    {
      url: `${BASE_URL}/guide`,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/guide/signs`,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/guide/glossary`,
      lastModified: SITE_UPDATED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...guides.map((g) => ({
      url: `${BASE_URL}/guide/${g.moduleId}`,
      lastModified: g.updatedAt ?? SITE_UPDATED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...["privacy", "terms", "cookies", "imprint"].map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: SITE_UPDATED,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
