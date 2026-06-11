"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { ModuleId } from "@/types";
import { FREE_PER_MODULE } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useBadges } from "@/hooks/useBadges";
import { useQuestions } from "@/hooks/useQuestions";
import { useUnlock } from "@/hooks/useUnlock";
import { useAnalytics } from "@/hooks/useAnalytics";
import AppShell from "@/components/layout/AppShell";
import ReturnBanner from "@/components/layout/ReturnBanner";
import ModuleCard from "@/components/modules/ModuleCard";
import BadgeGrid from "@/components/badges/BadgeGrid";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import modules from "@/data/modules";
import badges from "@/data/badges";
import { APP_PRICE } from "@/data/constants";
import { isMastered } from "@/lib/utils/progress";
import { useUIStore } from "@/stores/uiStore";
import { useState } from "react";

function PreviewCompleteScreen({ onUnlock }: { onUnlock: () => void }) {
  const { allQuestions, questionsByModule } = useQuestions();
  const { track } = useAnalytics();
  const gatedModules = modules.filter((m) => !m.alwaysFree);
  const totalFree = gatedModules.length * FREE_PER_MODULE;
  const totalAll = allQuestions.length;
  const pct = Math.round((totalFree / totalAll) * 100);

  return (
    <div className="min-h-dvh bg-stone-900">
      {/* Dark hero */}
      <div className="px-5 pt-12 pb-10 max-w-2xl mx-auto text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-3">
          You&apos;re {pct}% of the way there
        </p>
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight mb-3">
          Don&apos;t leave it unfinished
        </h1>
        <p className="text-stone-400 text-sm mb-6">
          You&apos;ve seen all {gatedModules.length} previews. The full course
          has {totalAll} questions.
        </p>
        <div className="mb-6">
          <ProgressBar value={pct} color="orange" height={6} />
        </div>
        <Button variant="primary" size="lg" full onClick={() => { track('upgrade_cta_clicked', { source: 'preview_complete' }); onUnlock(); }}>
          Unlock full course — {APP_PRICE}
        </Button>
        <p className="text-stone-500 text-xs mt-2">
          One-time payment. No subscription.
        </p>
      </div>

      {/* Incomplete module cards */}
      <div className="px-5 pb-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {gatedModules.map((mod) => {
            const qs = questionsByModule(mod.id as ModuleId);
            return (
              <div
                key={mod.id}
                className="bg-stone-800 border border-stone-700 rounded-xl p-4 opacity-80"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{mod.emoji}</span>
                  <p className="font-display font-bold text-white text-sm">
                    {mod.title}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {qs.map((q, i) => (
                    <div
                      key={q.id}
                      className={[
                        "w-2.5 h-2.5 rounded-full",
                        i < FREE_PER_MODULE ? "bg-orange" : "bg-stone-600",
                        i >= FREE_PER_MODULE ? "opacity-35" : "",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Second CTA */}
      <div className="px-5 pb-16 max-w-sm mx-auto text-center">
        <Button variant="primary" size="lg" full onClick={() => { track('upgrade_cta_clicked', { source: 'preview_complete' }); onUnlock(); }}>
          Unlock full course — {APP_PRICE}
        </Button>
      </div>
    </div>
  );
}

function UpgradeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshPremiumStatus } = useAuth();
  const setUpgradeToast = useUIStore((s) => s.setUpgradeToast);
  const { track } = useAnalytics();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setUpgradeToast(true);
      router.replace("/learn");
      refreshPremiumStatus();
      track("gate_converted", {});
      const timer = setTimeout(() => setUpgradeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, refreshPremiumStatus, setUpgradeToast, track]);

  return null;
}

export default function LearnIndexPage() {
  const router = useRouter();
  const { user, isPremium, isLoading: isAuthLoading } = useAuth();
  const progress = useProgress();
  const { earnedIds } = useBadges();
  const { allQuestions } = useQuestions();
  const handleUnlock = useUnlock();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showUpgradeToast = useUIStore((s) => s.showUpgradeToast);

  // Don't show preview-complete screen while auth is still resolving
  if (!isAuthLoading && progress.isPreviewComplete(isPremium)) {
    return (
      <PreviewCompleteScreen onUnlock={handleUnlock} />
    );
  }

  return (
    <AppShell wrongCount={progress.getReviewQueue().length}>
      <Suspense>
        <UpgradeHandler />
      </Suspense>
      {/* Upgrade success toast */}
      {showUpgradeToast && (
        <div className="bg-green-light border border-green text-green-dark px-5 py-3 flex items-center gap-2 animate-fade-up">
          <span>🚲</span>
          <span className="text-sm font-display font-medium">Welcome to BikeReady Premium</span>
        </div>
      )}

      {!user && !bannerDismissed && progress.getTotalSeen() >= 3 && (
        <ReturnBanner onDismiss={() => setBannerDismissed(true)} />
      )}

      <main className="min-h-dvh bg-stone-50 px-5 py-6 lg:py-10 max-w-5xl mx-auto">
        <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-6 lg:text-3xl">
          Practice
        </h1>

        {/* Module cards — progress is synchronous from store, no skeleton needed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {modules.map((mod, i) => (
            <div key={mod.id} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <ModuleCard
                module={mod}
                onClick={() => router.push(`/learn/${mod.id}`)}
              />
            </div>
          ))}
        </div>

        {/* Badge grid — shown only when user is premium or has earned at least one */}
        {(isPremium || earnedIds.size > 0) && (
          <BadgeGrid
            badges={badges}
            earnedIds={earnedIds}
            masteredIds={new Set(
              modules
                .filter((mod) => isMastered(mod.id, progress.progress, allQuestions))
                .map((mod) => mod.badgeId)
            )}
          />
        )}
      </main>
    </AppShell>
  );
}
