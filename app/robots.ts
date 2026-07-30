import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// AI search crawlers, listed explicitly. Allowing is already the default, so
// these entries change nothing technically - they document that the guide
// content is deliberately open to AI answer engines, and give us one place to
// revoke that if the position ever changes.
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /review and /test are deliberately NOT disallowed: they carry a
        // `noindex` meta tag, and a crawler blocked here would never be
        // allowed to read it. Blocked-but-linked URLs get indexed title-only.
        disallow: ["/api/", "/auth/"],
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: ["/api/", "/auth/"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
