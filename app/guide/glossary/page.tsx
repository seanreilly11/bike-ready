import glossaryData from "@/data/glossary.json";
import GlossaryContent from "@/components/guide/GlossaryContent";

export const metadata = {
  title: "Dutch Cycling Vocabulary — 74 Terms Translated | BikeReady",
  description:
    "Complete Dutch-English glossary for cyclists. Haaientanden, voorrang verlenen, fietsstraat, uitgezonderd — every term you'll see on Dutch roads, with pronunciation and context.",
  openGraph: {
    title: "Dutch Cycling Vocabulary — 74 Terms",
    description:
      "Every Dutch cycling term translated, with pronunciation guides and real-world context.",
    url: "https://bikeready.nl/guide/glossary",
  },
};

const allTerms = glossaryData.categories.flatMap((c) => c.terms);

export default function GlossaryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "Dutch Cycling Vocabulary",
            description:
              "74 Dutch cycling terms translated to English with pronunciation guides.",
            hasDefinedTerm: allTerms.slice(0, 20).map((t) => ({
              "@type": "DefinedTerm",
              name: t.term,
              description: `${t.translation} — ${t.context}`,
            })),
          }),
        }}
      />
      <GlossaryContent />
    </>
  );
}
