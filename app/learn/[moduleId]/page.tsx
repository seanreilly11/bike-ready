"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { ModuleId } from "@/types";
import { FREE_PER_MODULE } from "@/types";

import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useBadges } from "@/hooks/useBadges";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useUIStore } from "@/stores/uiStore";
import { useUnlock } from "@/hooks/useUnlock";
import { ArrowLeft, ArrowRight } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import ReturnBanner from "@/components/layout/ReturnBanner";
import UpsellBanner from "@/components/layout/UpsellBanner";
import DotMap from "@/components/modules/DotMap";
import QuestionCard from "@/components/questions/QuestionCard";
import BadgeToast from "@/components/badges/BadgeToast";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import ModuleIcon from "@/components/ui/ModuleIcon";
import StudyLayout from "@/components/layout/StudyLayout";
import StudyRail from "@/components/layout/StudyRail";
import modules from "@/data/modules";
import { useQuestions, activeQuestions } from "@/hooks/useQuestions";
import { isMastered } from "@/lib/utils/progress";

export default function ModuleSessionPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as ModuleId;

  const mod = modules.find((m) => m.id === moduleId);

  const { user, isPremium, isLoading: isAuthLoading } = useAuth();
  const openAuth = useUIStore((s) => s.openAuth);
  const handleUnlock = useUnlock();
  const progress = useProgress();
  const badges = useBadges();
  const { track } = useAnalytics();
  const { questionsByModule } = useQuestions();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredThisView, setAnsweredThisView] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const questionShownAt = useRef<number>(Date.now());

  const moduleQuestions = useMemo(
    () => questionsByModule(moduleId),
    [moduleId],
  );

  // Set starting position once when the module loads. Reading progress directly
  // from the store (not as a reactive dep) so that answering questions doesn't
  // re-run this effect and skip the feedback panel.
  useEffect(() => {
    setCurrentIndex(progress.getCurrentQuestionIndex(moduleId));
    track("module_started", { module: moduleId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  useEffect(() => {
    questionShownAt.current = Date.now();
    setAnsweredThisView(false);
  }, [currentIndex]);

  const currentQuestion = moduleQuestions[currentIndex];
  const seenInModule = progress.getModuleSeen(moduleId);
  const allDone = currentIndex >= moduleQuestions.length;
  const moduleStatus = progress.getModuleStatus(moduleId, isPremium);

  // Gate: free users after FREE_PER_MODULE questions, unless module is always free
  const hitGate =
    !isPremium && !mod?.alwaysFree && currentIndex >= FREE_PER_MODULE;

  useEffect(() => {
    if (hitGate) {
      track("gate_seen", { module: moduleId, source: "inline" });
    }
  }, [hitGate, moduleId, track]);

  const nextModuleIndex = modules.findIndex((m) => m.id === moduleId) + 1;
  const nextModule =
    nextModuleIndex < modules.length ? modules[nextModuleIndex] : null;

  if (!mod) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-stone-400">Module not found.</p>
      </div>
    );
  }

  async function handleAnswer(_optionId: string, correct: boolean) {
    if (!currentQuestion) return;
    await progress.recordAnswer(currentQuestion.id, correct);
    setAnsweredThisView(true);
    await badges.checkModuleBadge(moduleId);

    await track("question_answered", {
      question_id: currentQuestion.id,
      module: moduleId,
      skill: currentQuestion.skill,
      difficulty: currentQuestion.difficulty,
      correct,
      time_to_answer_ms: Date.now() - questionShownAt.current,
      context: "learn",
    });
  }

  function handleNext() {
    const next = currentIndex + 1;
    if (next === moduleQuestions.length) {
      track("module_completed", { module: moduleId });
    }
    setCurrentIndex(next);
  }

  function handleDotClick(idx: number) {
    if (idx !== currentIndex) {
      track("dot_map_jumped", {
        module: moduleId,
        from_index: currentIndex,
        to_index: idx,
      });
    }
    setCurrentIndex(idx);
  }

  const progressPct =
    moduleQuestions.length > 0
      ? Math.round((seenInModule / moduleQuestions.length) * 100)
      : 0;

  return (
    <AppShell wrongCount={progress.getReviewQueue().length}>
      {!isAuthLoading && !user && !bannerDismissed && progress.getTotalSeen() >= 3 && (
        <ReturnBanner onDismiss={() => setBannerDismissed(true)} />
      )}

      {/* Sticky sub-header */}
      <div className="sticky top-14 z-30 bg-white border-b border-stone-200 py-3">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => {
                if (currentIndex < moduleQuestions.length - 1) {
                  track("module_exited_early", {
                    module: mod.id,
                    question_index: currentIndex,
                    total_questions: moduleQuestions.length,
                  });
                }
                router.push("/learn");
              }}
              className="text-stone-400 hover:text-stone-900 text-sm focus-visible:outline-none cursor-pointer py-2 -my-2 px-1 -mx-1"
              aria-label="Back to modules"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <span className="font-display font-bold text-orange flex-1">
              {mod.title}
            </span>
            <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
              {seenInModule} / {moduleQuestions.length}
            </span>
          </div>
          <ProgressBar value={progressPct} color="orange" height={6} />
        </div>
      </div>

      <main className="min-h-dvh bg-stone-50">
        {/* Badge toast */}
        {badges.newBadge && (
          <BadgeToast
            badge={badges.newBadge}
            mastered={isMastered(
              badges.newBadge.moduleId ?? "",
              progress.progress,
              activeQuestions,
            )}
            onDismiss={badges.dismissNewBadge}
          />
        )}

        {allDone || hitGate ? (
          <div className="max-w-2xl mx-auto px-5 py-6 lg:py-10">
            {/* Dot map */}
            <div className="mb-6">
              <DotMap
                questions={moduleQuestions}
                progress={progress.progress}
                currentId={currentQuestion?.id ?? ""}
                onDotClick={handleDotClick}
                alwaysFree={mod.alwaysFree}
                moduleStatus={moduleStatus}
              />
            </div>

            {allDone ? (
              <div className="text-center py-10">
                <div className="flex justify-center mb-3">
                  <ModuleIcon icon={mod.icon} size="lg" />
                </div>
                <h2 className="font-display font-bold text-xl text-stone-900 mb-2">
                  Module complete
                </h2>
                <p className="text-stone-600 text-sm mb-6">
                  You&apos;ve seen all {moduleQuestions.length} questions in{" "}
                  {mod.title}.
                </p>
                {!user && (
                  <div className="bg-orange-light border border-orange-mid rounded-xl p-4 mb-6 text-sm text-stone-700">
                    Sign in so you don&apos;t lose what you&apos;ve done.{" "}
                    <button
                      onClick={() => openAuth("save_progress")}
                      className="font-bold text-orange underline underline-offset-2"
                    >
                      Sign in
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-3">
                  {nextModule && (
                    <Button
                      variant="primary"
                      size="lg"
                      full
                      onClick={() => router.push(`/learn/${nextModule.id}`)}
                    >
                      Next: {nextModule.title}{" "}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="lg"
                    full
                    onClick={() => router.push("/learn")}
                  >
                    Back to modules
                  </Button>
                </div>
              </div>
            ) : (
              /* End of free preview */
              <div className="animate-fade-up text-center">
                <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-6">
                  Free preview complete
                </p>

                {nextModule && (
                  <Button
                    variant="secondary"
                    size="lg"
                    full
                    onClick={() => router.push(`/learn/${nextModule.id}`)}
                  >
                    Next module: {nextModule.title}{" "}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                )}

                <div className="mt-6">
                  <UpsellBanner
                    moduleName={mod.title}
                    moduleQuestionCount={moduleQuestions.length}
                    onUnlock={handleUnlock}
                  />
                </div>
              </div>
            )}
          </div>
        ) : currentQuestion ? (
          /* Active question - reading column + desktop context rail */
          <StudyLayout
            reading={
              <div>
                {/* Dot map - mobile only; the rail shows progress on desktop */}
                <div className="mb-6 lg:hidden">
                  <DotMap
                    questions={moduleQuestions}
                    progress={progress.progress}
                    currentId={currentQuestion.id}
                    onDotClick={handleDotClick}
                    alwaysFree={mod.alwaysFree}
                    moduleStatus={moduleStatus}
                  />
                </div>

                <QuestionCard
                  key={currentQuestion.id}
                  question={currentQuestion}
                  onAnswer={handleAnswer}
                  answered={!!progress.progress[currentQuestion.id]?.correct}
                  selectedId={null}
                  answeredCorrect={
                    !!progress.progress[currentQuestion.id]?.correct
                  }
                  hideCorrect={false}
                  lessonHiddenOnDesktop
                />
                {(!!progress.progress[currentQuestion.id]?.correct ||
                  answeredThisView) && (
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      full
                      onClick={handleNext}
                    >
                      {currentIndex === moduleQuestions.length - 1 ? (
                        <>
                          <span>Complete module</span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </>
                      ) : (
                        <>
                          <span>Next question</span>
                          <ArrowRight size={16} aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            }
            rail={
              <StudyRail
                question={currentQuestion}
                moduleQuestions={moduleQuestions}
                progress={progress.progress}
                currentId={currentQuestion.id}
                onDotClick={handleDotClick}
                alwaysFree={mod.alwaysFree}
                moduleStatus={moduleStatus}
              />
            }
          />
        ) : null}
      </main>
    </AppShell>
  );
}
