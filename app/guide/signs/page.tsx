import signsData from "@/data/signs-reference.json";
import SignsContent from "@/components/guide/SignsContent";
import JsonLd from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, OG_DEFAULTS } from "@/lib/seo";

export const metadata = {
  title: "Dutch Road Signs Explained: Cyclist's Visual Guide",
  description:
    "How to read Dutch road signs. Learn the visual grammar - blue circles are mandatory, red borders are prohibitions, diagonal sashes mean end-of - then browse every sign with descriptions and Dutch names.",
  alternates: { canonical: "/guide/signs" },
  openGraph: {
    ...OG_DEFAULTS,
    title: "Dutch Road Signs Explained: Cyclist's Visual Guide",
    description:
      "The visual grammar of Dutch road signs explained, with every cycling sign illustrated.",
    url: "/guide/signs",
    type: "article",
  },
};

export default function SignsPage() {
  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: "Dutch Road Signs for Cyclists - Complete Guide",
            description:
              "How to read Dutch road signs. The visual grammar explained with every cycling sign illustrated.",
            path: "/guide/signs",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guide", path: "/guide" },
            { name: "Road signs", path: "/guide/signs" },
          ]),
        ]}
      />
      <SignsContent
        designSystem={signsData.design_system}
        signCategories={signsData.sign_categories}
      />
    </>
  );
}
