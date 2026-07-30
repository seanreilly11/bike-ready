import type { Metadata } from "next";
import OnboardingGate from "@/components/layout/OnboardingGate";

export const metadata: Metadata = {
  title: { default: "Practice", template: "%s - CycleDutch" },
  description:
    "Work through scenario-based questions across seven modules and build safe Dutch cycling instincts.",
  // Next does not self-canonicalise. Without this, tracking params (utm_*,
  // PostHog referrers) can be chosen as the canonical URL. Child module pages
  // override it in their own generateMetadata.
  alternates: { canonical: "/learn" },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OnboardingGate />
      {children}
    </>
  );
}
