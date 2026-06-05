import signsData from "@/data/signs-reference.json";
import SignsContent from "@/components/guide/SignsContent";

export const metadata = {
  title:
    "Dutch Road Signs for Cyclists — Complete Guide & Visual Reference | BikeReady",
  description:
    "How to read Dutch road signs. Learn the visual grammar — blue circles are mandatory, red borders are prohibitions, diagonal sashes mean end-of — then browse every sign with descriptions and Dutch names.",
  openGraph: {
    title: "Dutch Road Signs for Cyclists — Guide & Reference",
    description:
      "The visual grammar of Dutch road signs explained, with every cycling sign illustrated.",
    url: "https://bikeready.nl/guide/signs",
  },
};

export default function SignsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Dutch Road Signs for Cyclists — Complete Guide",
            description:
              "How to read Dutch road signs. The visual grammar explained with every cycling sign illustrated.",
            author: { "@type": "Organization", name: "BikeReady" },
            publisher: { "@type": "Organization", name: "BikeReady" },
          }),
        }}
      />
      <SignsContent
        designSystem={signsData.design_system}
        signCategories={signsData.sign_categories}
      />
    </>
  );
}
