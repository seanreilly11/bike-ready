"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ModuleId } from "@/types";
import { FREE_PER_MODULE, RETURN_BANNER_MIN } from "@/types";
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
import ModuleIcon from "@/components/ui/ModuleIcon";
import PageBanner from "@/components/layout/PageBanner";
import modules from "@/data/modules";
import badges from "@/data/badges";
import { APP_PRICE, RED_LIGHT_FINE } from "@/data/constants";
import { isMastered } from "@/lib/utils/progress";
import verifyPremium from "@/lib/mutations/verifyPremium";
import { useUIStore } from "@/stores/uiStore";

function PreviewCompleteScreen({ onUnlock }: { onUnlock: () => void }) {
  const { allQuestions, questionsByModule } = useQuestions();
  const { track } = useAnalytics();
  const gatedModules = modules.filter((m) => !m.alwaysFree);
  const totalFree = gatedModules.length * FREE_PER_MODULE;
  const totalAll = allQuestions.length;
  const pct = Math.round((totalFree / totalAll) * 100);

  useEffect(() => {
    modules
      .filter((m) => !m.alwaysFree)
      .forEach((mod) => {
        track("gate_seen", { module: mod.id, source: "preview_complete" });
      });
  }, [track]);

  return (
    <AppShell wrongCount={0}>
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
            You&apos;ve seen all {gatedModules.length} previews. The full
            course has {totalAll} questions.
          </p>
          <div className="mb-6">
            <ProgressBar value={pct} color="orange" height={6} />
          </div>
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              track("upgrade_cta_clicked", { source: "preview_complete" });
              onUnlock();
            }}
          >
            Unlock full course - {APP_PRICE}
          </Button>
          <p className="text-stone-500 text-xs mt-2">
            Less than a red-light fine ({RED_LIGHT_FINE}). One-time, no
            subscription.
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
                    <ModuleIcon icon={mod.icon} size="sm" />
                    <p className="font-display font-bold text-white text-sm">
                      {mod.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {qs.map((q, i) => (
                      <div
                        key={q.id}
                        className={[
                          "w-3 h-3 rounded-full",
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

        {/* Free escape hatches - this screen must never be a dead end */}
        <div className="px-5 pb-10 max-w-md mx-auto text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-stone-500 mb-3">
            Keep practicing free
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/learn/fundamentals"
              className="text-sm font-display font-bold text-white underline underline-offset-4 hover:text-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
            >
              Fundamentals - always free
            </Link>
            <Link
              href="/guide"
              className="text-sm font-display font-bold text-white underline underline-offset-4 hover:text-orange transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
            >
              Read the Guide
            </Link>
          </div>
        </div>

        {/* Second CTA */}
        <div className="px-5 pb-16 max-w-sm mx-auto text-center">
          <Button
            variant="primary"
            size="lg"
            full
            onClick={() => {
              track("upgrade_cta_clicked", { source: "preview_complete" });
              onUnlock();
            }}
          >
            Unlock full course - {APP_PRICE}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

const NOTICES: Record<string, string> = {
  auth_error:
    "We couldn't sign you in. The link may have expired - request a new one.",
  checkout_failed: "Something went wrong starting checkout. Please try again.",
};

function UpgradeHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUpgradeToast = useUIStore((s) => s.setUpgradeToast);
  const { track } = useAnalytics();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      const sessionId = searchParams.get("session_id") ?? undefined;
      setUpgradeToast(true);
      router.replace("/learn");
      // Reconcile against Stripe directly - the webhook may not have landed
      // yet when the user is redirected back from checkout.
      verifyPremium(sessionId);
      track("gate_converted", {});
      const timer = setTimeout(() => setUpgradeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, setUpgradeToast, track]);

  // Derived from the URL - no state to keep in sync. Dismiss clears the param.
  const errorKey =
    searchParams.get("auth_error") === "1"
      ? "auth_error"
      : searchParams.get("error");
  const notice = errorKey ? NOTICES[errorKey] : undefined;

  if (!notice) return null;
  return (
    <div className="bg-red-light border border-red text-red-dark px-5 py-3 flex items-center justify-between gap-3 animate-fade-up">
      <span className="text-sm font-display font-medium">{notice}</span>
      <button
        onClick={() => router.replace("/learn")}
        className="text-red-dark/70 hover:text-red-dark text-sm font-display shrink-0 focus-visible:outline-none"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export default function LearnIndexPage() {
  const router = useRouter();
  const { user, isPremium, isLoading: isAuthLoading } = useAuth();
  const progress = useProgress();
  const { earnedIds } = useBadges();
  const { allQuestions } = useQuestions();
  const handleUnlock = useUnlock();
  const showUpgradeToast = useUIStore((s) => s.showUpgradeToast);
  const showReturnBanner = useUIStore((s) => s.showReturnBanner);
  const dismissReturnBanner = useUIStore((s) => s.dismissReturnBanner);

  const answeredCount = allQuestions.filter(
    (q) => progress.progress[q.id]?.seen,
  ).length;
  const completionPct = allQuestions.length
    ? Math.round((answeredCount / allQuestions.length) * 100)
    : 0;

  // Don't show preview-complete screen while auth is still resolving
  if (!isAuthLoading && progress.isPreviewComplete(isPremium)) {
    return <PreviewCompleteScreen onUnlock={handleUnlock} />;
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
          <span className="text-sm font-display font-medium">
            Welcome to CycleDutch Premium
          </span>
        </div>
      )}

      {!isAuthLoading &&
        !user &&
        showReturnBanner &&
        progress.getTotalSeen() >= RETURN_BANNER_MIN && (
          <ReturnBanner
            onDismiss={dismissReturnBanner}
            seenCount={progress.getTotalSeen()}
          />
        )}

      <main className="min-h-dvh bg-stone-50 px-5 py-6 lg:py-10 max-w-5xl mx-auto">
        <PageBanner
          title="Practice"
          subtitle="Work through real Dutch cycling scenarios, one question at a time."
          right={
            <span className="font-mono text-xs uppercase tracking-wide text-orange bg-white border border-orange-mid rounded-full px-3 py-1.5">
              {modules.length} modules · {completionPct}% done
            </span>
          }
        />

        {/* Module cards - progress is synchronous from store, no skeleton needed */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
          {modules.map((mod, i) => (
            <div
              key={mod.id}
              className="animate-fade-up h-full"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <ModuleCard
                module={mod}
                onClick={() => router.push(`/learn/${mod.id}`)}
              />
            </div>
          ))}
        </div>

        {/* Badge grid - shown only when user is premium or has earned at least one */}
        {(isPremium || earnedIds.size > 0) && (
          <BadgeGrid
            badges={badges}
            earnedIds={earnedIds}
            masteredIds={
              new Set(
                modules
                  .filter((mod) =>
                    isMastered(mod.id, progress.progress, allQuestions),
                  )
                  .map((mod) => mod.badgeId),
              )
            }
          />
        )}
      </main>
    </AppShell>
  );
}
