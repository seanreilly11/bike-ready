import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import LandingButton from "@/components/layout/LandingButton";
import HeroSection from "@/components/layout/HeroSection";
import ModuleIcon from "@/components/ui/ModuleIcon";
import modules from "@/data/modules";
import { APP_PRICE } from "@/data/constants";
import { FREE_PER_MODULE } from "@/types";
import { PREMIUM_ENABLED } from "@/lib/config";

export const metadata: Metadata = {
  title: "CycleDutch — Cycle safely in the Netherlands",
  description:
    "Learn Dutch road rules, signs, and bike priority before your first ride. A short scenario-based course for expats. Know what to do before you ride.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "CycleDutch — Cycle safely in the Netherlands",
    description:
      "Real scenarios, real Dutch rules. Know what to do before you ride.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CycleDutch — Cycle safely in the Netherlands",
    description:
      "Real scenarios, real Dutch rules. Know what to do before you ride.",
  },
};

const howItWorks = [
  {
    step: "1",
    title: "Scenario",
    body: "You're dropped into a real Dutch cycling moment. Make a call.",
  },
  {
    step: "2",
    title: "Feedback",
    body: "Instant feedback confirms your instinct or corrects it with the actual rule.",
  },
  {
    step: "3",
    title: "Lesson",
    body: "Open the lesson accordion to go deeper on any skill, any time.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Nav currentRoute="/" wrongCount={0} logoOnly showStartLearning />
      <main className="min-h-dvh bg-stone-50 overflow-x-hidden">
        {/* Hero */}
        <HeroSection />

        {/* How it works */}
        <section className="px-5 py-12 max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-xl text-stone-900 mb-6 lg:text-2xl">
            How it works
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="bg-white border border-stone-200 rounded-xl p-4"
              >
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-2">
                  Step {item.step}
                </span>
                <h3 className="font-display font-bold text-stone-900 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Module grid */}
        <section className="px-5 pb-12 max-w-5xl mx-auto">
          <h2 className="font-display font-bold text-xl text-stone-900 mb-4 lg:text-2xl">
            {modules.length} modules
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {modules.map((mod) => (
              <Link
                key={mod.id}
                href={`/learn/${mod.id}`}
                className={[
                  "bg-white border border-stone-200 rounded-xl p-4",
                  "hover:border-stone-400 hover:shadow-md transition-all duration-200",
                  "flex flex-col justify-between",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
                ].join(" ")}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <ModuleIcon icon={mod.icon} size="sm" />
                    <p className="font-display font-bold text-sm text-orange">
                      {mod.title}
                    </p>
                  </div>
                  <p className="text-xs text-stone-500 leading-relaxed mb-2">
                    {mod.description}
                  </p>
                </div>
                {PREMIUM_ENABLED && (
                  mod.alwaysFree ? (
                    <p className="text-xs text-green font-mono uppercase tracking-wide">
                      Entire module free
                    </p>
                  ) : (
                    <p className="text-xs text-stone-400 font-mono uppercase tracking-wide">
                      {FREE_PER_MODULE} free questions
                    </p>
                  )
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* Foreigner callout */}
        <section className="bg-transparent border border-orange px-5 py-10 mx-5 mb-12 rounded-2xl max-w-5xl lg:mx-auto">
          <h2 className="font-display font-extrabold text-2xl text-orange tracking-tight mb-2">
            Built for foreigners, not Dutch people
          </h2>
          <p className="text-orange/90 text-sm leading-relaxed max-w-lg">
            Dutch cyclists learn this stuff as kids. You didn&apos;t. CycleDutch
            targets exactly the rules that differ from what you already know —
            so you recalibrate fast and stay safe.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="px-5 pb-16 max-w-2xl mx-auto text-center">
          <LandingButton variant="bottom" />
          {PREMIUM_ENABLED && (
            <p className="text-stone-400 text-xs mt-2 font-mono uppercase tracking-wide">
              Full course {APP_PRICE} one-time · No subscription
            </p>
          )}
        </section>
      </main>
    </>
  );
}
