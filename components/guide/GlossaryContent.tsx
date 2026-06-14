"use client";

import { useState, useMemo, useEffect } from "react";
import glossaryData from "@/data/glossary.json";
import Card from "@/components/ui/Card";
import { useAnalytics } from "@/hooks/useAnalytics";

const allTerms = glossaryData.categories.flatMap((c) =>
  c.terms.map((t) => ({ ...t, categoryId: c.id, categoryTitle: c.title }))
);

export default function GlossaryContent() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { track } = useAnalytics();

  const filteredTerms = useMemo(() => {
    const q = search.toLowerCase();
    return allTerms.filter((t) => {
      const matchesSearch =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.translation.toLowerCase().includes(q);
      const matchesCategory =
        !activeCategory || t.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  useEffect(() => {
    if (!search) return;
    const timer = setTimeout(() => {
      track("glossary_searched", { query: search, results_count: filteredTerms.length });
    }, 500);
    return () => clearTimeout(timer);
  }, [search, filteredTerms.length, track]);

  const activeLabel = activeCategory
    ? glossaryData.categories.find((c) => c.id === activeCategory)?.title
    : null;

  const resultLabel = (() => {
    const n = filteredTerms.length;
    const parts = [`${n} term${n !== 1 ? "s" : ""}`];
    if (activeLabel) parts.push(`in ${activeLabel}`);
    if (search) parts.push(`matching "${search}"`);
    return parts.join(" ");
  })();

  return (
    <main className="min-h-dvh bg-stone-50 px-5 py-6 lg:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-1">
          {allTerms.length} terms
        </p>
        <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-2 lg:text-3xl">
          Dutch cycling glossary
        </h1>
        <p className="text-stone-500 text-sm mb-6">
          Dutch cycling words you&apos;ll see on signs, roads, and paths —
          translated with pronunciation.
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <label htmlFor="glossary-search" className="sr-only">
          Search Dutch or English terms
        </label>
        <input
          id="glossary-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Dutch or English…"
          aria-label="Search Dutch or English terms"
          className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange focus:border-transparent"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-none">
        <button
          onClick={() => {
            if (activeCategory !== null) {
              setActiveCategory(null);
              track("glossary_category_filtered", { category: null });
            }
          }}
          aria-pressed={activeCategory === null}
          className={[
            "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
            activeCategory === null
              ? "bg-stone-900 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200",
          ].join(" ")}
        >
          All
        </button>
        {glossaryData.categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              const next = activeCategory === cat.id ? null : cat.id;
              setActiveCategory(next);
              track("glossary_category_filtered", { category: next });
            }}
            aria-pressed={activeCategory === cat.id}
            className={[
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-display font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
              activeCategory === cat.id
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200",
            ].join(" ")}
          >
            {cat.title}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-xs text-stone-400 mb-4">{resultLabel}</p>

      {/* Terms */}
      {filteredTerms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm">No terms match your search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredTerms.map((term) => (
            <Card
              key={term.term}
              id={term.term.replace(/\s+/g, "-").toLowerCase()}
              className="animate-fade-up"
            >
              <div className="flex items-start justify-between gap-4 mb-1">
                <h2 className="font-display font-bold text-stone-900 text-sm">
                  {term.term}
                </h2>
                <span className="font-mono text-xs text-stone-400 flex-shrink-0 mt-0.5">
                  {term.pronunciation}
                </span>
              </div>
              <p className="text-sm text-orange font-medium mb-1">
                {term.translation}
              </p>
              <p className="text-xs text-stone-500 leading-relaxed">
                {term.context}
              </p>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
