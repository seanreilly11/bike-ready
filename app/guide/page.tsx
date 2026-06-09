import Link from "next/link";
import { ChevronRight } from "lucide-react";
import guides from "@/data/guides.json";
import Card from "@/components/ui/Card";

export const metadata = {
  title: "Dutch Cycling Guide for Expats | BikeReady",
  description:
    "Everything you need to know about cycling in the Netherlands. 6 in-depth guides covering priority rules, trams, roundabouts, legal requirements, and Dutch vocabulary, plus a visual signs reference.",
  openGraph: {
    title: "Dutch Cycling Guide for Expats",
    description:
      "6 guides, a glossary, and a complete signs reference. The rules Dutch cyclists follow instinctively — explained for newcomers.",
    url: "https://bikeready.nl/guide",
    type: "website",
  },
};

export default function GuideLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: "Dutch Cycling Guide for Expats",
            description:
              "Everything you need to know about cycling in the Netherlands.",
            provider: { "@type": "Organization", name: "BikeReady" },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "online",
            },
          }),
        }}
      />

      <main className="min-h-dvh bg-stone-50 px-5 py-6 lg:py-10 max-w-5xl mx-auto">
        <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-2 lg:text-3xl">
          Guide
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Free reference guides, glossary, and signs reference for cycling in
          the Netherlands.
        </p>

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
