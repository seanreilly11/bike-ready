import type { Metadata } from "next";
import OnboardingGate from "@/components/layout/OnboardingGate";

export const metadata: Metadata = {
  title: { default: "Practice", template: "%s - CycleDutch" },
  description:
    "Work through scenario-based questions across six modules and build safe Dutch cycling instincts.",
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
