"use client";

import type { SignsDesignSystem, SignsCategory } from "@/types";
import Card from "@/components/ui/Card";
import SignCard from "@/components/guide/SignCard";
import RuleCard from "@/components/guide/RuleCard";

interface SignsContentProps {
  designSystem: SignsDesignSystem;
  signCategories: SignsCategory[];
}

const TOC_SECTIONS = [
  { id: "how-to-read", label: "How to read signs" },
  { id: "blue-circles", label: "Blue circles" },
  { id: "end-of-pattern", label: "End-of pattern" },
  { id: "red-borders", label: "Red borders" },
  { id: "sub-signs", label: "Sub-signs" },
  { id: "priority-signs", label: "Priority signs" },
  { id: "traffic-lights", label: "Traffic lights" },
  { id: "information-signs", label: "Information signs" },
];

const SHAPE_RULE_IDS = [
  "shape_circle",
  "shape_triangle",
  "shape_rectangle",
  "shape_diamond",
];

export default function SignsContent({
  designSystem,
  signCategories,
}: SignsContentProps) {
  const shapeRules = designSystem.rules.filter((r) =>
    SHAPE_RULE_IDS.includes(r.id),
  );
  const colourRules = designSystem.rules.filter((r) =>
    ["colour_blue", "colour_red_border", "colour_red_bar"].includes(r.id),
  );
  const sashRules = designSystem.rules.filter((r) =>
    ["sash_red", "sash_grey"].includes(r.id),
  );
  const subSignRule = designSystem.rules.find((r) => r.id === "sub_signs");

  const mandatory = signCategories.find((c) => c.id === "mandatory");
  const prohibition = signCategories.find((c) => c.id === "prohibition");
  const information = signCategories.find((c) => c.id === "information");
  const prioritySigns = signCategories.find((c) => c.id === "priority_signs");
  const signals = signCategories.find((c) => c.id === "signals");

  return (
    <div className="min-h-dvh bg-stone-50">
      {/* Sticky ToC */}
      <div className="sticky top-[104px] z-20 bg-stone-50 border-b border-stone-200 py-2">
        <div className="max-w-5xl px-5 mx-auto flex gap-2 overflow-x-auto scrollbar-none">
          {TOC_SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-display font-medium bg-white border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-colors duration-150 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>

      <main className="px-5 py-6 lg:py-10 max-w-5xl mx-auto">
        <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-2 lg:text-3xl">
          Dutch road signs explained
        </h1>
        <p className="text-stone-500 text-sm mb-6">{designSystem.intro}</p>

        {/* ── How to read signs ──────────────────────────────────────── */}
        <section id="how-to-read" className="mb-12 scroll-mt-40">
          <h2 className="font-display font-bold text-stone-900 text-lg mb-4">
            How to read any sign
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {shapeRules.map((rule, i) => (
              <div
                key={rule.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <RuleCard rule={rule} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {colourRules.map((rule, i) => (
              <div
                key={rule.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <RuleCard rule={rule} />
              </div>
            ))}
          </div>
          <Card accent="orange">
            <p className="text-sm text-stone-900 font-medium leading-relaxed">
              Quick rule: shape tells you the category, colour tells you the
              type. A blue circle with a white bike = you <em>must</em> use that
              path. A white circle with a red border and a bike = you{" "}
              <em>cannot</em> cycle there.
            </p>
          </Card>
        </section>

        {/* ── Blue circles ───────────────────────────────────────────── */}
        {mandatory && (
          <section id="blue-circles" className="mb-12 scroll-mt-40">
            <h2 className="font-display font-bold text-stone-900 text-lg mb-2">
              Blue circles — mandatory
            </h2>
            <p className="text-stone-600 text-sm mb-4 leading-relaxed">
              {mandatory.description} A solid blue circle with a white symbol
              means you must follow the instruction — no exceptions unless a
              sub-sign says otherwise. The most important for cyclists is the
              mandatory cycle path (G11): when you see it, you must use that
              path. Riding on the adjacent road is a violation.
            </p>
            <div className="flex flex-col gap-3">
              {mandatory.signs.map((sign, i) => (
                <div
                  key={sign.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <SignCard sign={sign} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── End-of pattern ─────────────────────────────────────────── */}
        <section id="end-of-pattern" className="mb-12 scroll-mt-40">
          <h2 className="font-display font-bold text-stone-900 text-lg mb-2">
            The end-of pattern
          </h2>
          <div className="flex flex-col gap-3">
            {sashRules.map((rule, i) => (
              <div
                key={rule.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <RuleCard rule={rule} />
              </div>
            ))}
          </div>
        </section>

        {/* ── Red borders ────────────────────────────────────────────── */}
        {prohibition && (
          <section id="red-borders" className="mb-12 scroll-mt-40">
            <h2 className="font-display font-bold text-stone-900 text-lg mb-2">
              Red borders — prohibition
            </h2>
            <p className="text-stone-600 text-sm mb-4 leading-relaxed">
              {prohibition.description} A white circle with a red border
              prohibits whatever is shown inside. These always apply to you
              unless an &lsquo;uitgezonderd fietsers&rsquo; sub-sign is present
              below.
            </p>
            <div className="flex flex-col gap-3">
              {prohibition.signs.map((sign, i) => (
                <div
                  key={sign.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <SignCard sign={sign} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Sub-signs ──────────────────────────────────────────────── */}
        {subSignRule && (
          <section id="sub-signs" className="mb-12 scroll-mt-40">
            <h2 className="font-display font-bold text-stone-900 text-lg mb-2">
              Sub-signs
            </h2>
            <Card>
              <p className="text-sm text-stone-600 leading-relaxed">
                {subSignRule.body}
              </p>
            </Card>
          </section>
        )}

        {/* ── Priority signs ─────────────────────────────────────────── */}
        {prioritySigns && (
          <section id="priority-signs" className="mb-12 scroll-mt-40">
            <h2 className="font-display font-bold text-stone-900 text-lg mb-2">
              Priority signs &amp; markings
            </h2>
            <p className="text-stone-600 text-sm mb-4 leading-relaxed">
              {prioritySigns.description} The priority road diamond and shark
              teeth markings override the right-before-left default at every
              junction where they appear.
            </p>
            <div className="flex flex-col gap-3">
              {prioritySigns.signs.map((sign, i) => (
                <div
                  key={sign.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <SignCard sign={sign} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Traffic lights ─────────────────────────────────────────── */}
        {signals && (
          <section id="traffic-lights" className="mb-12 scroll-mt-40">
            <h2 className="font-display font-bold text-stone-900 text-lg mb-2">
              Your traffic light
            </h2>
            <p className="text-stone-600 text-sm mb-4 leading-relaxed">
              {signals.description} The cyclist traffic light is positioned at
              handlebar height, not at car height. It is legally independent
              from the car signal — your red is your red, regardless of what the
              large light shows.
            </p>
            <div className="flex flex-col gap-3">
              {signals.signs.map((sign, i) => (
                <div
                  key={sign.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <SignCard sign={sign} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Information signs ──────────────────────────────────────── */}
        {information && (
          <section id="information-signs" className="mb-12 scroll-mt-40">
            <h2 className="font-display font-bold text-stone-900 text-lg mb-2">
              Information signs
            </h2>
            <p className="text-stone-600 text-sm mb-4 leading-relaxed">
              {information.description} These rectangular signs tell you facts
              about the road — they carry no command.
            </p>
            <div className="flex flex-col gap-3 mb-6">
              {information.signs.map((sign, i) => (
                <div
                  key={sign.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <SignCard sign={sign} />
                </div>
              ))}
            </div>
            {/* Mandatory vs optional callout */}
            <Card variant="muted">
              <p className="font-display font-bold text-stone-900 text-sm mb-3">
                Mandatory vs optional — the key distinction
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg px-3 py-3 text-center">
                  <p className="font-mono text-xs text-stone-400 mb-1">G11</p>
                  <p className="font-display font-bold text-sm text-stone-900 mb-0.5">
                    Round blue sign
                  </p>
                  <p className="text-xs text-orange font-medium">Must use</p>
                </div>
                <div className="bg-white rounded-lg px-3 py-3 text-center">
                  <p className="font-mono text-xs text-stone-400 mb-1">G13</p>
                  <p className="font-display font-bold text-sm text-stone-900 mb-0.5">
                    White rectangle
                  </p>
                  <p className="text-xs text-stone-500 font-medium">
                    Your choice
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}
      </main>
    </div>
  );
}
