"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ModuleId } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useBadges } from "@/hooks/useBadges";
import { useQuestions } from "@/hooks/useQuestions";
import AppShell from "@/components/layout/AppShell";
import ReturnBanner from "@/components/layout/ReturnBanner";
import ModuleCard from "@/components/modules/ModuleCard";
import BadgeGrid from "@/components/badges/BadgeGrid";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import modules from "@/data/modules";
import badges from "@/data/badges";
import { APP_PRICE } from "@/data/constants";
import { FREE_PER_MODULE } from "@/types";

function PreviewCompleteScreen({ onUnlock }: { onUnlock: () => void }) {
  const { allQuestions, questionsByModule } = useQuestions();
  const gatedModules = modules.filter((m) => !m.alwaysFree);
  const totalFree = gatedModules.length * FREE_PER_MODULE;
  const totalAll = allQuestions.length;
  const pct = Math.round((totalFree / totalAll) * 100);

  return (
    <div className="min-h-screen bg-stone-900">
      {/* Dark hero */}
      <div className="px-5 pt-12 pb-10 max-w-2xl mx-auto text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-3">
          You&apos;re {pct}% of the way there
        </p>
        <h1 className="font-display font-extrabold text-3xl text-white tracking-tight mb-3">
          Don&apos;t leave it unfinished
        </h1>
        <p className="text-stone-400 text-sm mb-6">
          You&apos;ve seen all {gatedModules.length} previews. The full course has {totalAll}{" "}
          questions.
        </p>
        <div className="mb-6">
          <ProgressBar value={pct} color="orange" height={6} />
        </div>
        <Button variant="primary" size="lg" full onClick={onUnlock}>
          Unlock full course — {APP_PRICE}
        </Button>
        <p className="text-stone-500 text-xs mt-2">
          One-time payment. No subscription.
        </p>
      </div>

      {/* Incomplete module cards */}
      <div className="px-5 pb-12 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        i < 2 ? "bg-orange" : "bg-stone-600",
                      ].join(" ")}
                      style={{
                        opacity: i >= 2 ? 0.35 : 1,
                      }}
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
        <Button variant="primary" size="lg" full onClick={onUnlock}>
          Unlock full course — {APP_PRICE}
        </Button>
      </div>
    </div>
  );
}

function ModuleCardSkeleton() {
  return (
    <div className="w-full bg-white border border-stone-200 rounded-xl p-4 animate-pulse">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="h-5 w-32 bg-stone-200 rounded" />
        <div className="h-5 w-20 bg-stone-200 rounded-full" />
      </div>
      <div className="space-y-1.5 mb-3">
        <div className="h-3.5 w-full bg-stone-200 rounded" />
        <div className="h-3.5 w-4/5 bg-stone-200 rounded" />
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 rounded-full bg-stone-200" />
        ))}
      </div>
      <div className="h-3 w-16 bg-stone-200 rounded" />
    </div>
  );
}

export default function LearnIndexPage() {
  const router = useRouter();
  const { user, isPremium, isLoading: isAuthLoading } = useAuth();
  const progress = useProgress();
  const { earnedIds } = useBadges();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isLoadingProgress = isAuthLoading || (user !== null && !progress.isLoaded);

  if (progress.isPreviewComplete(isPremium)) {
    return (
      <PreviewCompleteScreen onUnlock={() => router.push("/api/checkout")} />
    );
  }

  return (
    <AppShell wrongCount={progress.getReviewQueue().length}>
      {!user && !bannerDismissed && progress.getTotalSeen() >= 3 && (
        <ReturnBanner onDismiss={() => setBannerDismissed(true)} />
      )}

      <main className="min-h-screen bg-stone-50 px-5 py-6 lg:py-10 max-w-5xl mx-auto">
        <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-6 lg:text-3xl">
          Learn
        </h1>

        {/* Module cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          {isLoadingProgress
            ? modules.map((mod) => <ModuleCardSkeleton key={mod.id} />)
            : modules.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  onClick={() => router.push(`/learn/${mod.id}`)}
                />
              ))}
        </div>

        {/* Badge grid — shown only when user is premium or has earned at least one */}
        {(isPremium || earnedIds.size > 0) && (
          <BadgeGrid badges={badges} earnedIds={earnedIds} />
        )}
      </main>
    </AppShell>
  );
}
