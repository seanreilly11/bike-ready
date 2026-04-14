"use client";

import { useABTest } from "@/hooks/useABTest";
import LandingButton from "@/components/layout/LandingButton";
import { FREE_PER_MODULE } from "@/types";
import { PREMIUM_ENABLED } from "@/lib/config";

const variants = ["control", "variant_a", "variant_b"] as const;
type HeroVariant = (typeof variants)[number];

const heroContent: Record<
  HeroVariant,
  { eyebrow: string; heading: string; body: string }
> = {
  control: {
    eyebrow: "For expats cycling in the Netherlands",
    heading: "Go from uncertain to confident cycling on Dutch roads.",
    body: "Dutch cycling is one of life's great joys — once you know how it works. BikeReady teaches you the rules before the road does, so every ride feels safe, natural, and yours.",
  },
  variant_a: {
    eyebrow: "Don't learn Dutch cycling rules the hard way",
    heading: "Know the rules before you ride. Not after.",
    body: "Right-of-way. Shark teeth. Cycle path etiquette. Dutch roads have unwritten rules — and breaking them is expensive or dangerous. BikeReady gets you fluent in 30 minutes.",
  },
  variant_b: {
    eyebrow: "Join 2,400+ expats who've figured it out",
    heading: "The Dutch cycling crash course for expats.",
    body: "Six modules. Real scenarios. Instant feedback. Master the rules that actually matter in the Netherlands — from priority intersections to cycle path law.",
  },
};

export default function HeroSection() {
  const variant = useABTest("hero_copy", variants);
  const content = heroContent[variant ?? "control"];

  return (
    <section className="bg-orange px-5 pt-12 pb-14 md:pt-20 md:pb-20">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-wide text-white/70 mb-3">
          {content.eyebrow}
        </p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight leading-tight mb-4">
          {content.heading}
        </h1>
        <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6 max-w-lg">
          {content.body}
        </p>

        <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5 mb-6">
          <span className="text-white/90 text-sm font-display">
            2,400+ expats ready to ride
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
            {FREE_PER_MODULE} free questions per module — no account needed
          </p>
        )}
      </div>
    </section>
  );
}
