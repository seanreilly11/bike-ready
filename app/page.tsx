import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/layout/Nav";
import LandingButton from "@/components/layout/LandingButton";
import modules from "@/data/modules";
import { APP_PRICE } from "@/data/constants";
import { FREE_PER_MODULE } from "@/types";

export const metadata: Metadata = {
  title: "BikeReady — Cycle safely in the Netherlands",
  description:
    "A short preparation course for expats. Real scenarios, real Dutch rules. Know what to do before you ride.",
  openGraph: {
    title: "BikeReady — Cycle safely in the Netherlands",
    description:
      "Real scenarios, real Dutch rules. Know what to do before you ride.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BikeReady — Cycle safely in the Netherlands",
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
      <Nav currentRoute="/" wrongCount={0} logoOnly />
      <main className="min-h-screen bg-stone-50 overflow-x-hidden">
        {/* Hero */}
        <section className="bg-orange px-5 pt-12 pb-14 md:pt-20 md:pb-20">
          <div className="max-w-2xl mx-auto">
            <p className="font-mono text-xs uppercase tracking-wide text-white/70 mb-3">
              For expats cycling in the Netherlands
            </p>
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight leading-tight mb-4">
              Go from uncertain to confident cycling on Dutch roads.
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6 max-w-lg">
              Dutch cycling is one of life's great joys — once you know how it
              works. BikeReady teaches you the rules before the road does, so
              every ride feels safe, natural, and yours.
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
            <p className="text-white/60 text-xs mt-3 font-mono uppercase tracking-wide">
              {FREE_PER_MODULE} free questions per module — no account needed
            </p>
          </div>
        </section>

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
            6 modules
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
                  <p className="font-display font-bold text-sm text-orange mb-1">
                    {mod.title}
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed mb-2">
                    {mod.description}
                  </p>
                </div>
                {mod.alwaysFree ? (
                  <p className="text-xs text-green font-mono uppercase tracking-wide">
                    Entire module free
                  </p>
                ) : (
                  <p className="text-xs text-stone-400 font-mono uppercase tracking-wide">
                    {FREE_PER_MODULE} free questions
                  </p>
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
            Dutch cyclists learn this stuff as kids. You didn&apos;t. BikeReady
            targets exactly the rules that differ from what you already know —
            so you recalibrate fast and stay safe.
          </p>
        </section>

        {/* Bottom CTA */}
        <section className="px-5 pb-16 max-w-2xl mx-auto text-center">
          <LandingButton variant="bottom" />
          <p className="text-stone-400 text-xs mt-2 font-mono uppercase tracking-wide">
            Full course {APP_PRICE} one-time · No subscription
          </p>
        </section>
      </main>
    </>
  );
}
