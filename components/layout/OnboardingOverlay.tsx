"use client";

import { useEffect, useState } from "react";
import { Bike, ArrowRight, ArrowLeft } from "lucide-react";
import type { ModuleId, RiderProfile, RidingTimeline } from "@/types";
import Button from "@/components/ui/Button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useModalFocus } from "@/hooks/useModalFocus";
import { useUIStore } from "@/stores/uiStore";
import modules from "@/data/modules";
import {
  RIDER_PROFILES,
  RIDING_TIMELINES,
  DEFAULT_PROFILE,
  DEFAULT_TIMELINE,
  moduleForProfile,
  planLine,
} from "@/data/onboardingProfiles";

interface OnboardingOverlayProps {
  onComplete: (moduleId: ModuleId) => void;
  onSkip: () => void;
}

const TOTAL_STEPS = 4;

// A 4-step investment wizard: intro -> situation -> timeline -> personalized
// plan. Two choices are captured and spent (situation picks the first module,
// timeline flavors the plan copy). The real onboarding is still the first
// question the plan deep-links to.
export default function OnboardingOverlay({
  onComplete,
  onSkip,
}: OnboardingOverlayProps) {
  const { track } = useAnalytics();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<RiderProfile>(DEFAULT_PROFILE);
  const [timeline, setTimeline] = useState<RidingTimeline>(DEFAULT_TIMELINE);

  const finish = (skipped: boolean) => {
    if (skipped) {
      track("onboarding_skipped", { step });
      useUIStore.getState().completeOnboarding();
      onSkip();
    } else {
      track("onboarding_profile_selected", { profile, timeline });
      track("onboarding_completed", {});
      useUIStore.getState().completeOnboarding({ profile, timeline });
      onComplete(moduleForProfile(profile));
    }
  };

  useEffect(() => {
    track("onboarding_started", {});
  }, [track]);

  const { dialogRef, trapFocus } = useModalFocus(() => finish(true));

  // Refocus the dialog whenever the step changes. The Back control unmounts on
  // the way back to step 0, which would drop focus to <body> and bypass the
  // trap; refocusing also makes screen readers announce the new step's heading
  // via aria-labelledby.
  useEffect(() => {
    dialogRef.current?.focus();
  }, [step, dialogRef]);

  const targetModule = modules.find((m) => m.id === moduleForProfile(profile));
  const isLastStep = step === TOTAL_STEPS - 1;

  const pillClass = (selected: boolean) =>
    [
      "w-full text-left rounded-xl border px-4 py-3 text-sm font-display transition-colors",
      "min-h-[44px] cursor-pointer",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
      selected
        ? "border-orange bg-orange-light text-stone-900 font-bold"
        : "border-stone-200 text-stone-700 hover:border-stone-400",
    ].join(" ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop - clicking it skips, same as Escape */}
      <div
        className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm"
        onClick={() => finish(true)}
        aria-hidden
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        onKeyDown={trapFocus}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 pb-8 animate-fade-up focus-visible:outline-none"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-5" aria-hidden="true">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 rounded-full transition-all duration-200",
                i === step ? "w-5 bg-orange" : "w-1.5 bg-stone-200",
              ].join(" ")}
            />
          ))}
        </div>

        {step === 0 && (
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
              You&apos;re dropped into real Dutch cycling moments - answer on
              instinct, and the feedback confirms or corrects your mental model.
              The question is the lesson. No account needed to start.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="mb-6">
            <h2
              id="onboarding-title"
              className="font-display font-extrabold text-xl text-stone-900 mb-4 text-center"
            >
              What brings you to Dutch cycling?
            </h2>
            <div
              role="group"
              aria-labelledby="onboarding-title"
              className="flex flex-col gap-2"
            >
              {RIDER_PROFILES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfile(p.id)}
                  aria-pressed={profile === p.id}
                  className={pillClass(profile === p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mb-6">
            <h2
              id="onboarding-title"
              className="font-display font-extrabold text-xl text-stone-900 mb-4 text-center"
            >
              When do you start riding?
            </h2>
            <div
              role="group"
              aria-labelledby="onboarding-title"
              className="flex flex-col gap-2"
            >
              {RIDING_TIMELINES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeline(t.id)}
                  aria-pressed={timeline === t.id}
                  className={pillClass(timeline === t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center mb-6">
            <p className="font-mono text-xs uppercase tracking-wide text-orange mb-2">
              Your plan
            </p>
            <h2
              id="onboarding-title"
              className="font-display font-extrabold text-lg text-stone-900 mb-3 leading-snug"
            >
              {planLine(profile, timeline)}
            </h2>
            <p className="text-stone-600 text-sm">
              {targetModule?.alwaysFree
                ? "The essentials, all free. No account needed."
                : "3 free questions, no account needed."}
            </p>
          </div>
        )}

        {/* Primary CTA */}
        {isLastStep ? (
          <Button variant="primary" size="lg" full onClick={() => finish(false)}>
            <span>Start with {targetModule?.title}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => setStep((s) => s + 1)}
          >
            <span>{step === 0 ? "Get started" : "Continue"}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </Button>
        )}

        {/* Back + Skip row */}
        <div className="flex items-center justify-between mt-3">
          {step > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back</span>
            </Button>
          ) : (
            <span />
          )}
          <Button variant="ghost" size="sm" onClick={() => finish(true)}>
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}
