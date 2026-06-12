"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useProgress } from "@/hooks/useProgress";
import { useAnalytics } from "@/hooks/useAnalytics";
import guidesData from "@/data/guides.json";

const SECTION_TABS = [
  {
    href: "/guide",
    label: "Guides",
    match: (p: string) =>
      p === "/guide" ||
      (p.startsWith("/guide/") &&
        !p.startsWith("/guide/glossary") &&
        !p.startsWith("/guide/signs")),
  },
  {
    href: "/guide/glossary",
    label: "Glossary",
    match: (p: string) => p.startsWith("/guide/glossary"),
  },
  {
    href: "/guide/signs",
    label: "Signs",
    match: (p: string) => p.startsWith("/guide/signs"),
  },
];

const MODULE_IDS = guidesData.map((g) => g.moduleId);

export default function GuideShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const progress = useProgress();
  const { track } = useAnalytics();

  const moduleId = MODULE_IDS.find((id) => pathname === `/guide/${id}`);
  const isModuleDetail = !!moduleId;
  const currentGuide = isModuleDetail
    ? guidesData.find((g) => g.moduleId === moduleId)
    : null;

  return (
    <AppShell wrongCount={progress.getReviewQueue().length}>
      {/* Section tabs or module header */}
      <div className="sticky top-14 z-30 bg-white border-b border-stone-200">
        {isModuleDetail && currentGuide ? (
          <div className="max-w-5xl mx-auto px-5">
            {/* Back + title row */}
            <div className="h-11 flex items-center gap-3">
              <Link
                href="/guide"
                className="text-sm text-stone-500 hover:text-stone-900 transition-colors duration-150 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Guides
              </Link>
              <span className="text-stone-400">/</span>
              <span className="text-sm font-display font-semibold text-stone-900 truncate">
                {currentGuide.title}
              </span>
            </div>
            {/* ToC pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {currentGuide.sections.map((section, i) => (
                <a
                  key={i}
                  href={`#section-${i}`}
                  onClick={() =>
                    track("guide_toc_clicked", {
                      module: currentGuide.moduleId,
                      section_index: i,
                      section_heading: section.heading,
                    })
                  }
                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-display font-medium bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
                >
                  {section.heading}
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-5 flex gap-1">
            {SECTION_TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={[
                    "px-4 py-3 text-sm font-display font-medium border-b-2 -mb-px transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 rounded-t",
                    active
                      ? "border-orange text-orange"
                      : "border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300",
                  ].join(" ")}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {children}
    </AppShell>
  );
}
