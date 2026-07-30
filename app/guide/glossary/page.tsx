import glossaryData from "@/data/glossary.json";
import GlossaryContent from "@/components/guide/GlossaryContent";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, definedTermSetJsonLd, OG_DEFAULTS } from "@/lib/seo";

export const metadata = {
  title: "Dutch Cycling Glossary: 74 Terms Translated with Pronunciation",
  description:
    "Complete Dutch-English glossary for cyclists. Haaientanden, voorrang verlenen, fietsstraat, uitgezonderd - every term you'll see on Dutch roads, with pronunciation and context.",
  alternates: { canonical: "/guide/glossary" },
  openGraph: {
    ...OG_DEFAULTS,
    title: "Dutch Cycling Glossary: 74 Terms Translated",
    description:
      "Every Dutch cycling term translated, with pronunciation guides and real-world context.",
    url: "/guide/glossary",
  },
};

const allTerms = glossaryData.categories.flatMap((c) => c.terms);

// Must match the anchor id generated in GlossaryContent.tsx.
const termAnchor = (term: string) => term.replace(/\s+/g, "-").toLowerCase();

export default function GlossaryPage() {
  return (
    <>
      <JsonLd
        data={[
          definedTermSetJsonLd(
            "Dutch Cycling Vocabulary",
            "74 Dutch cycling terms translated to English with pronunciation guides.",
            allTerms.map((t) => ({
              name: t.term,
              description: `${t.translation} - ${t.context}`,
              path: `/guide/glossary#${termAnchor(t.term)}`,
            })),
          ),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guide", path: "/guide" },
            { name: "Glossary", path: "/guide/glossary" },
          ]),
        ]}
      />
      <GlossaryContent />
    </>
  );
}
