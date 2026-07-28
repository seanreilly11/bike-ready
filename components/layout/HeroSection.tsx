"use client";

import { Route } from "lucide-react";
import { useABTest } from "@/hooks/useABTest";
import LandingButton from "@/components/layout/LandingButton";
import modules from "@/data/modules";
import { FREE_PER_MODULE } from "@/types";
import { PREMIUM_ENABLED } from "@/lib/config";
import {
  HERO_COPY_TEST,
  HERO_COPY_VARIANTS,
  type HeroCopyVariant,
} from "@/lib/abTest";
import { TRUST_LINE } from "@/data/constants";

const heroContent: Record<
  HeroCopyVariant,
  { eyebrow: string; heading: string; body: string }
> = {
  control: {
    eyebrow: "For expats cycling in the Netherlands",
    heading: "Go from uncertain to confident cycling on Dutch roads.",
    body: "Dutch cycling is one of life's great joys - once you know how it works. CycleDutch teaches you the rules before the road does, so every ride feels safe, natural, and yours.",
  },
  variant_a: {
    eyebrow: "Don't learn Dutch cycling rules the hard way",
    heading: "Know the rules before you ride. Not after.",
    body: "Right-of-way. Shark teeth. Cycle path etiquette. Dutch roads have unwritten rules - and breaking them is expensive or dangerous. CycleDutch teaches you to read the road like a local.",
  },
  variant_b: {
    eyebrow: "What Dutch cyclists learned as kids",
    heading: "The Dutch cycling crash course for expats.",
    body: "Seven modules. Real scenarios. Instant feedback. Master the rules that actually matter in the Netherlands - from priority intersections to cycle path law.",
  },
};

export default function HeroSection({
  initialVariant,
}: {
  initialVariant: HeroCopyVariant;
}) {
  const variant = useABTest(HERO_COPY_TEST, HERO_COPY_VARIANTS, initialVariant);
  const content = heroContent[variant ?? "control"];

  return (
    <section className="relative overflow-hidden bg-orange pt-12 pb-14 md:pt-20 md:pb-20">
      {/* Flat background shapes for depth (no gradient) */}
      <div
        className="absolute -top-24 right-[18%] w-80 h-80 rounded-full bg-white/[0.07] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-28 -left-12 w-64 h-64 rounded-full bg-white/[0.06] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-[1] max-w-2xl lg:max-w-5xl mx-auto px-5 grid lg:grid-cols-2 lg:gap-12 lg:items-center">
        {/* Text */}
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-white/70 mb-3">
            {content.eyebrow}
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight mb-4">
            {content.heading}
          </h1>
          <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6 max-w-lg">
            {content.body}
          </p>

          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5 mb-6">
            <span className="text-white/90 text-sm font-display">
              {TRUST_LINE}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <LandingButton
              variant="hero"
              className="bg-white! text-orange! hover:bg-white/90!"
            />
          </div>
          {PREMIUM_ENABLED && (
            <p className="text-white/60 text-xs mt-3 font-mono uppercase tracking-wide">
              {FREE_PER_MODULE} free questions per module - no account needed
            </p>
          )}
        </div>

        {/* Visual - flat tiles of the modules you'll master (desktop only) */}
        <div className="hidden lg:block">
          <div className="bg-white/[0.12] border border-white/25 rounded-2xl p-6 animate-fade-up">
            <p className="font-mono text-xs uppercase tracking-wide text-white/80 mb-4 flex items-center gap-2">
              <Route size={14} aria-hidden="true" /> What you&apos;ll master
            </p>
            <div className="flex flex-col gap-1.5">
              {modules.slice(0, 4).map((mod, i) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${150 + i * 90}ms` }}
                  >
                    <div
                      className={[
                        "group flex items-center gap-3 rounded-xl p-2 -mx-2 cursor-default",
                        "transition-all duration-200 ease-out hover:bg-white/10 hover:translate-x-1",
                        i >= 2 ? "opacity-60 hover:opacity-100" : "",
                      ].join(" ")}
                    >
                      <span className="flex-none size-12 rounded-xl bg-white text-orange flex items-center justify-center shadow-md transition-transform duration-200 ease-out group-hover:scale-110 group-hover:shadow-lg">
                        <Icon size={24} strokeWidth={1.75} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-wide text-white/60">
                          Module {String(i + 1).padStart(2, "0")}
                        </p>
                        <p className="font-display font-bold text-white text-sm">
                          {mod.title}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
