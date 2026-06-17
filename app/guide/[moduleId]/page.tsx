import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import guides from "@/data/guides.json";
import Card from "@/components/ui/Card";
import JsonLd from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";
import { linkifyTerms } from "@/lib/linkifyTerms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const guide = guides.find((g) => g.moduleId === moduleId);
  if (!guide) return {};

  const title = guide.seoTitle ?? guide.title;
  const path = `/guide/${guide.moduleId}`;
  return {
    title,
    description: guide.subtitle,
    alternates: { canonical: path },
    openGraph: {
      title,
      description: guide.subtitle,
      url: path,
      type: "article",
      modifiedTime: guide.updatedAt,
    },
  };
}

export async function generateStaticParams() {
  return guides.map((g) => ({ moduleId: g.moduleId }));
}

export default async function ModuleGuidePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const guide = guides.find((g) => g.moduleId === moduleId);
  if (!guide) notFound();

  const idx = guides.findIndex((g) => g.moduleId === moduleId);
  const prev = idx > 0 ? guides[idx - 1] : null;
  const next = idx < guides.length - 1 ? guides[idx + 1] : null;

  const path = `/guide/${guide.moduleId}`;

  // Shared across the whole page so each glossary term auto-links only once.
  const linkedTerms = new Set<string>();

  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            headline: `${guide.title} — Dutch Cycling Guide`,
            description: guide.subtitle,
            path,
            dateModified: guide.updatedAt,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guide", path: "/guide" },
            { name: guide.title, path },
          ]),
          ...(guide.faqs?.length ? [faqPageJsonLd(guide.faqs)] : []),
        ]}
      />

      <main className="min-h-dvh bg-stone-50 px-5 py-6 lg:py-10 max-w-5xl mx-auto">
        <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-2 lg:text-3xl">
          {guide.h1 ?? guide.title}
        </h1>
        <p className="text-stone-500 text-sm mb-6">{guide.subtitle}</p>

        <div className="flex flex-col gap-10">
          {guide.sections.map((section, i) => (
            <article key={i} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <h2
                id={`section-${i}`}
                className="font-display font-bold text-stone-900 text-base mb-3 scroll-mt-40"
              >
                {section.heading}
              </h2>
              <div className="text-stone-600 text-sm leading-relaxed space-y-3">
                {section.body.split("\n\n").map((para, j) => (
                  <p key={j}>{linkifyTerms(para, linkedTerms)}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Frequently asked questions */}
        {guide.faqs?.length ? (
          <section
            className="mt-12 pt-8 border-t border-stone-200 animate-fade-up"
            aria-labelledby="faq-heading"
          >
            <h2
              id="faq-heading"
              className="font-display font-bold text-stone-900 text-lg mb-4"
            >
              Common questions
            </h2>
            <dl className="flex flex-col gap-5">
              {guide.faqs.map((faq, i) => (
                <div key={i}>
                  <dt className="font-display font-semibold text-stone-900 text-sm mb-1">
                    {faq.q}
                  </dt>
                  <dd className="text-stone-600 text-sm leading-relaxed">
                    {faq.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* Practice CTA — send guide readers into the matching question set */}
        <section className="mt-12 pt-8 border-t border-stone-200 animate-fade-up">
          <Link
            href={`/learn/${guide.moduleId}`}
            className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded-xl"
          >
            <Card hover>
              <span className="text-xs text-stone-400">Ready to practise?</span>
              <p className="text-sm font-display font-semibold text-stone-900 group-hover:text-orange transition-colors duration-150 mt-0.5 flex items-center gap-1">
                Practise {guide.title} questions
                <ArrowRight size={14} aria-hidden="true" />
              </p>
            </Card>
          </Link>
        </section>

        {/* Previous / Next navigation */}
        <nav
          className="mt-12 pt-8 border-t border-stone-200 flex gap-3 animate-fade-up"
          style={{ animationDelay: `${guide.sections.length * 80}ms` }}
          aria-label="Guide navigation"
        >
          {prev ? (
            <Link
              href={`/guide/${prev.moduleId}`}
              className="flex-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded-xl"
            >
              <Card hover>
                <span className="text-xs text-stone-400 flex items-center gap-1"><ArrowLeft size={12} aria-hidden="true" />Previous</span>
                <p className="text-sm font-display font-semibold text-stone-900 group-hover:text-orange transition-colors duration-150 mt-0.5">
                  {prev.title}
                </p>
              </Card>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {next ? (
            <Link
              href={`/guide/${next.moduleId}`}
              className="flex-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded-xl"
            >
              <Card hover className="text-right">
                <span className="text-xs text-stone-400 flex items-center gap-1 justify-end">Next<ArrowRight size={12} aria-hidden="true" /></span>
                <p className="text-sm font-display font-semibold text-stone-900 group-hover:text-orange transition-colors duration-150 mt-0.5">
                  {next.title}
                </p>
              </Card>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </nav>
      </main>
    </>
  );
}
