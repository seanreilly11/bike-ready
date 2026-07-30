import guides from "@/data/guides.json";
import { SITE_URL } from "@/lib/seo";

// llms.txt (llmstxt.org): a plain-text map of the site for AI answer engines,
// pointing them at the reference guides rather than the client-rendered app
// shells. Statically generated - the content is all build-time data.
export const dynamic = "force-static";

const INTRO = `# CycleDutch

> A short preparation course for expats learning to cycle safely in the
> Netherlands. Scenario-based questions on Dutch road rules, signs, and bike
> priority, with explanations grounded in Dutch traffic law (RVV 1990).

CycleDutch is not affiliated with any Dutch authority and is not an official
licence or exam - there is no cycling licence in the Netherlands.

## Reference guides
`;

const OUTRO = `
## Other pages

- [Road signs](${SITE_URL}/guide/signs): every Dutch cycling sign, with the visual grammar that makes them readable.
- [Glossary](${SITE_URL}/guide/glossary): Dutch cycling vocabulary with definitions.
- [Practice](${SITE_URL}/learn): the interactive question course (requires a browser session).

## Notes

- Guide pages are the canonical, citable content. /learn, /review, and /test are stateful app screens with no standalone text.
- Contact and operator details: ${SITE_URL}/imprint
`;

export function GET() {
  const guideLines = guides
    .map((g) => `- [${g.title}](${SITE_URL}/guide/${g.moduleId}): ${g.subtitle}`)
    .join("\n");

  return new Response(`${INTRO}\n${guideLines}\n${OUTRO}`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
