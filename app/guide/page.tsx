import Link from "next/link";
import { ChevronRight } from "lucide-react";
import guides from "@/data/guides.json";
import Card from "@/components/ui/Card";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd, SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Dutch Cycling Rules & Guides for Expats",
  description:
    "Everything you need to know about cycling in the Netherlands. 6 in-depth guides covering priority rules, trams, roundabouts, legal requirements, and Dutch vocabulary, plus a visual signs reference.",
  alternates: { canonical: "/guide" },
  openGraph: {
    title: "Dutch Cycling Rules & Guides for Expats",
    description:
      "6 guides, a glossary, and a complete signs reference. The rules Dutch cyclists follow instinctively — explained for newcomers.",
    url: "/guide",
    type: "website",
  },
};

export default function GuideLandingPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Course",
            name: "Dutch Cycling Guide for Expats",
            description:
              "Everything you need to know about cycling in the Netherlands.",
            provider: {
              "@type": "Organization",
              name: "BikeReady",
              url: SITE_URL,
            },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "online",
            },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guide", path: "/guide" },
          ]),
        ]}
      />

      <main className="min-h-dvh bg-stone-50 px-5 py-6 lg:py-10 max-w-5xl mx-auto">
        <div className="bg-orange-light border border-orange-mid rounded-2xl px-5 py-5 mb-6 sm:px-6">
          <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight lg:text-3xl">
            Dutch cycling guides for expats
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            Free reference guides, glossary, and signs reference for cycling in
            the Netherlands.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {guides.map((guide, i) => (
            <Link
              key={guide.moduleId}
              href={`/guide/${guide.moduleId}`}
              className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded-xl animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Card hover>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display font-bold text-stone-900 text-sm group-hover:text-orange transition-colors duration-150">
                      {guide.title}
                    </h2>
                    <p className="text-stone-500 text-xs mt-0.5 line-clamp-1" title={guide.subtitle}>
                      {guide.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-stone-400">
                      {guide.sections.length} topics
                    </span>
                    <ChevronRight size={16} className="text-stone-400 group-hover:text-orange transition-colors duration-150" aria-hidden="true" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
