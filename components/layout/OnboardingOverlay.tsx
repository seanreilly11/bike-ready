"use client";

import { useEffect } from "react";
import { Bike, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useUIStore } from "@/stores/uiStore";

interface OnboardingOverlayProps {
  /** Primary CTA label - the caller decides where completing navigates. */
  ctaLabel: string;
  onComplete: () => void;
  onSkip: () => void;
}

// Single-screen intro. The real onboarding is the first Fundamentals
// question - this just sets context and hands the user straight to it.
export default function OnboardingOverlay({
  ctaLabel,
  onComplete,
  onSkip,
}: OnboardingOverlayProps) {
  const { track } = useAnalytics();

  const finish = (skipped: boolean) => {
    track(skipped ? "onboarding_skipped" : "onboarding_completed", {});
    useUIStore.getState().completeOnboarding();
    if (skipped) onSkip();
    else onComplete();
  };

  useEffect(() => {
    track("onboarding_started", {});
  }, [track]);

  const { dialogRef, trapFocus } = useModalFocus(() => finish(true));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop - clicking it skips, same as Escape */}
      <div
        className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
        onClick={() => finish(true)}
        aria-hidden
      />

      {/* Card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onKeyDown={trapFocus}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 pb-8 animate-fade-up focus-visible:outline-none"
      >
        <div className="text-center mb-6">
          <div className="mb-3 flex justify-center">
            <Bike size={48} className="text-orange" aria-hidden="true" />
          </div>
          <h2
            id="onboarding-title"
            className="font-display font-extrabold text-xl text-stone-900 mb-2"
          >
            Welcome to CycleDutch
          </h2>
          <p className="text-stone-600 text-sm leading-relaxed">
            A short, one-time course for expats cycling in the Netherlands.
            You&apos;re dropped into real cycling moments - answer on instinct,
            and the feedback confirms or corrects your mental model. The
            question is the lesson. Fundamentals is free and no account needed
            to start.
          </p>
        </div>

        <Button variant="primary" size="lg" full onClick={() => finish(false)}>
          <span>{ctaLabel}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Button>

        <div className="flex justify-center mt-3">
          <Button variant="ghost" size="sm" onClick={() => finish(true)}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
