"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import OnboardingOverlay from "@/components/layout/OnboardingOverlay";
import { useUIStore } from "@/stores/uiStore";
import { isOnboardingDone } from "@/lib/onboarding";

// Storage never changes behind our back within a session (completion goes
// through the uiStore flag), so no subscription is needed.
const subscribeNoop = () => () => {};

// Shows onboarding on the first visit to any /learn page - visitors arriving
// via the guide or a shared link never pass the landing CTA. The server
// snapshot reads "done" so SSR renders nothing and hydration stays stable.
// Completing the wizard always deep-links to the module its plan recommends.
export default function OnboardingGate() {
  const router = useRouter();
  const onboardingDone = useUIStore((s) => s.onboardingDone);
  const storageDone = useSyncExternalStore(
    subscribeNoop,
    isOnboardingDone,
    () => true,
  );

  if (storageDone || onboardingDone) return null;

  return (
    <OnboardingOverlay
      onComplete={(moduleId) => router.push(`/learn/${moduleId}`)}
      onSkip={() => {}}
    />
  );
}
