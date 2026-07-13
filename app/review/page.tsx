"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useUIStore } from "@/stores/uiStore";
import {
  X,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  LockOpen,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import QuestionCard from "@/components/questions/QuestionCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ModuleIcon from "@/components/ui/ModuleIcon";
import PageBanner from "@/components/layout/PageBanner";
import modules from "@/data/modules";
import { useQuestions } from "@/hooks/useQuestions";
import { PREMIUM_ENABLED } from "@/lib/config";

// ─── Free user FOMO screen ────────────────────────────────────────────────────

function FreeReviewScreen() {
  const progress = useProgress();
  const openGate = useUIStore((s) => s.openGate);
  const { allQuestions } = useQuestions();

  // Premium not launched yet: same screen, "coming soon" copy, inert CTAs.
  const comingSoon = !PREMIUM_ENABLED;

  const rawProgress = progress.progress;

  const wrongQuestions = Object.entries(rawProgress)
    .filter(([, v]) => v.seen && !v.correct)
    .map(([id]) => allQuestions.find((q) => q.id === id))
    .filter((q): q is Question => q !== undefined);

  const total = wrongQuestions.length;

  const blurredByModule = modules
    .map((mod) => ({
      mod,
      qs: wrongQuestions.filter((q) => q.module === mod.id),
    }))
    .filter((g) => g.qs.length > 0);

  // ── State 1: no wrong answers yet ──────────────────────────────────────────
  if (total === 0) {
    const previewGroups = modules
      .map((mod) => ({
        mod,
        qs: allQuestions.filter((q) => q.module === mod.id).slice(0, 2),
      }))
      .filter((g) => g.qs.length > 0)
      .slice(0, 2);

    return (
      <AppShell wrongCount={0}>
        <main className="min-h-dvh bg-stone-50 pb-40">
          <div className="max-w-2xl mx-auto px-5 pt-6 pb-0">
            <p className="font-mono text-[11px] font-medium tracking-widest uppercase text-orange mb-1.5">
              Review
            </p>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-900 mb-2">
              Fix your mistakes.
            </h1>
            <p className="text-[13px] text-stone-600 leading-relaxed mb-5">
              Answer questions in the modules — anything you get wrong lands here to fix.
            </p>

            {comingSoon ? (
              <div className="bg-orange rounded-xl px-4 py-3.5 flex items-center justify-center mb-6">
                <p className="text-white font-bold text-sm leading-snug">
                  Coming soon
                </p>
              </div>
            ) : (
              <div className="bg-orange rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 mb-6">
                <div>
                  <p className="text-white font-bold text-sm leading-snug">
                    Your mistakes will appear here
                  </p>
                  <p className="font-mono text-[11px] text-white/65 mt-0.5">
                    Fix these before your next ride
                  </p>
                </div>
                <button
                  onClick={() => openGate()}
                  aria-label="Unlock Review"
                  className="bg-white text-orange font-bold text-[13px] rounded-full py-1.5 px-3.5 cursor-pointer whitespace-nowrap hover:bg-orange-light transition-colors"
                >
                  Unlock{" "}
                  <ArrowRight size={14} aria-hidden="true" className="inline" />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {previewGroups.map(({ mod, qs }, groupIndex) => (
                <div key={mod.id} style={{ opacity: groupIndex === 0 ? 1 : 0.7 }}>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display font-bold text-sm text-orange flex items-center gap-2">
                      {mod.title}
                    </h2>
                    <span className="font-mono text-[11px] text-orange uppercase tracking-widest">
                      {qs.length} to fix
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {qs.map((q, cardIndex) => (
                      <div
                        key={q.id}
                        aria-hidden="true"
                        className="bg-white border-[1.5px] border-red-mid border-l-[3px] border-l-red rounded-xl px-[15px] py-3 flex items-start gap-3 blur-sm pointer-events-none select-none"
                        style={{ opacity: cardIndex === 1 ? 0.6 : 1 }}
                      >
                        <X size={14} className="text-red shrink-0 mt-px" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-stone-900 font-medium leading-snug mb-1">
                            {q.prompt.length > 82 ? q.prompt.slice(0, 82) + "…" : q.prompt}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
                              {q.skill}
                            </span>
                            <Badge variant={q.difficulty} label={q.difficulty} />
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-stone-400 shrink-0 mt-px" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 text-center bg-gradient-to-b from-transparent to-[rgba(250,250,248,0.95)] pt-10 -mt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="inline-flex flex-col items-center gap-2.5 bg-white border border-stone-200 rounded-2xl px-5 py-[18px] shadow-lg min-w-[260px]">
              <LockOpen size={24} className="text-stone-500" aria-hidden="true" />
              <p className="font-display font-bold text-[15px] text-stone-900 tracking-tight leading-snug text-center">
                {comingSoon ? "Review is coming soon" : "Unlock to fix your mistakes"}
              </p>
              <p className="font-mono text-[10px] text-stone-400 tracking-wide text-center">
                {comingSoon
                  ? "We're putting the finishing touches on this."
                  : "Less than the fine for running a red light"}
              </p>
              <button
                onClick={comingSoon ? undefined : () => openGate()}
                disabled={comingSoon}
                aria-label={comingSoon ? "Review coming soon" : "Unlock Review for €4.99"}
                className={
                  comingSoon
                    ? "w-full bg-stone-200 text-stone-500 font-bold text-[14px] rounded-[10px] py-[11px] px-7 cursor-not-allowed"
                    : "w-full bg-orange text-white font-bold text-[14px] rounded-[10px] py-[11px] px-7 cursor-pointer"
                }
              >
                {comingSoon ? "Coming soon" : "Unlock for €4.99"}
              </button>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  // ── State 2: has wrong answers ─────────────────────────────────────────────
  return (
    <AppShell wrongCount={0}>
      <main className="min-h-dvh bg-stone-50 pb-40">
        <div className="max-w-2xl mx-auto px-5 pt-6 pb-0">
          <p className="font-mono text-[11px] font-medium tracking-widest uppercase text-orange mb-1.5">
            Review
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-stone-900 mb-2">
            Fix your mistakes.
          </h1>
          <p className="text-[13px] text-stone-600 leading-relaxed mb-5">
            You have{" "}
            <span className="font-bold text-stone-900">
              {total} question{total !== 1 ? "s" : ""}
            </span>{" "}
            waiting for review.{" "}
            {comingSoon
              ? "Review is coming soon - you'll be able to fix them shortly."
              : "Go premium now to fix them before your next ride."}
          </p>

          {/* Orange banner */}
          {comingSoon ? (
            <div className="bg-orange rounded-xl px-4 py-3.5 flex items-center justify-center mb-6">
              <p className="text-white font-bold text-sm leading-snug">
                Coming soon
              </p>
            </div>
          ) : (
            <div className="bg-orange rounded-xl px-4 py-3.5 flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-white font-bold text-sm leading-snug">
                  {total} question{total !== 1 ? "s" : ""} waiting for you
                </p>
                <p className="font-mono text-[11px] text-white/65 mt-0.5">
                  Fix these before your next ride
                </p>
              </div>
              <button
                onClick={() => openGate()}
                aria-label="Unlock Review"
                className="bg-white text-orange font-bold text-[13px] rounded-full py-1.5 px-3.5 cursor-pointer whitespace-nowrap hover:bg-orange-light transition-colors"
              >
                Unlock{" "}
                <ArrowRight size={14} aria-hidden="true" className="inline" />
              </button>
            </div>
          )}

          {/* Blurred question groups */}
          <div className="flex flex-col gap-4 relative">
            {blurredByModule.map(({ mod, qs }, groupIndex) => {
              const groupOpacity =
                groupIndex === 0 ? 1 : groupIndex === 1 ? 0.7 : 0.45;

              return (
                <div key={mod.id} style={{ opacity: groupOpacity }}>
                  {/* Module header - NOT blurred */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display font-bold text-sm text-orange flex items-center gap-2">
                      {mod.title}
                    </h2>
                    <span className="font-mono text-[11px] text-orange uppercase tracking-widest">
                      {qs.length} to fix
                    </span>
                  </div>

                  {/* Question cards - blurred */}
                  <div className="flex flex-col gap-2">
                    {qs.map((q, cardIndex) => {
                      const cardOpacity =
                        cardIndex >= 2
                          ? Math.max(0.25, 1 - (cardIndex - 1) * 0.3)
                          : 1;

                      return (
                        <div
                          key={q.id}
                          aria-hidden="true"
                          className="bg-white border-[1.5px] border-red-mid border-l-[3px] border-l-red rounded-xl px-[15px] py-3 flex items-start gap-3 blur-sm pointer-events-none select-none"
                          style={{ opacity: cardOpacity }}
                        >
                          <X
                            size={14}
                            className="text-red shrink-0 mt-px"
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-stone-900 font-medium leading-snug mb-1">
                              {q.prompt.length > 82
                                ? q.prompt.slice(0, 82) + "…"
                                : q.prompt}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">
                                {q.skill}
                              </span>
                              <Badge
                                variant={q.difficulty}
                                label={q.difficulty}
                              />
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-stone-400 shrink-0 mt-px"
                            aria-hidden="true"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom CTA */}
        <div className="sticky bottom-0 text-center bg-gradient-to-b from-transparent to-[rgba(250,250,248,0.95)] pt-10 -mt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="inline-flex flex-col items-center gap-2.5 bg-white border border-stone-200 rounded-2xl px-5 py-[18px] shadow-lg min-w-[260px]">
            <LockOpen size={24} className="text-stone-500" aria-hidden="true" />
            <p className="font-display font-bold text-[15px] text-stone-900 tracking-tight leading-snug text-center">
              {comingSoon
                ? "Review is coming soon"
                : `Unlock to fix ${total} mistake${total !== 1 ? "s" : ""}`}
            </p>
            <p className="font-mono text-[10px] text-stone-400 tracking-wide text-center">
              {comingSoon
                ? "We're putting the finishing touches on this."
                : "Less than the fine for running a red light"}
            </p>
            <button
              onClick={comingSoon ? undefined : () => openGate()}
              disabled={comingSoon}
              aria-label={
                comingSoon ? "Review coming soon" : "Unlock Review for €4.99"
              }
              className={
                comingSoon
                  ? "w-full bg-stone-200 text-stone-500 font-bold text-[14px] rounded-[10px] py-[11px] px-7 cursor-not-allowed"
                  : "w-full bg-orange text-white font-bold text-[14px] rounded-[10px] py-[11px] px-7 cursor-pointer"
              }
            >
              {comingSoon ? "Coming soon" : "Unlock for €4.99"}
            </button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}

// ─── Premium review screen (unchanged) ───────────────────────────────────────

export default function ReviewPage() {
  const router = useRouter();
  const { isPremium, isLoading: isAuthLoading } = useAuth();
  const progress = useProgress();
  const { track } = useAnalytics();
  const { allQuestions } = useQuestions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const queue = progress.getReviewQueue();
  const hadItemsRef = useRef(queue.length > 0);
  const questionShownAt = useRef<number>(0);

  useEffect(() => {
    if (queue.length > 0) {
      hadItemsRef.current = true;
    }
  });

  useEffect(() => {
    if (queue.length === 0 && !activeId && hadItemsRef.current) {
      track("review_cleared", {});
    }
  }, [queue.length, activeId, track]);

  useEffect(() => {
    questionShownAt.current = Date.now();
  }, [activeId]);

  if (!PREMIUM_ENABLED) {
    return <FreeReviewScreen />;
  }
  if (isAuthLoading) {
    return (
      <AppShell wrongCount={0}>
        <main className="min-h-dvh bg-stone-50" />
      </AppShell>
    );
  }
  if (!isPremium) {
    return <FreeReviewScreen />;
  }

  // Look up from allQuestions (not queue) so the card stays mounted after a correct
  // answer removes the question from the queue before React commits hasAnswered=true.
  const activeQ = activeId
    ? (allQuestions.find((q) => q.id === activeId) ?? null)
    : null;

  function openQuestion(id: string, position: number) {
    const question = allQuestions.find((q) => q.id === id);
    if (question) {
      track("review_question_opened", {
        question_id: question.id,
        module: question.module,
        position,
      });
    }
    setActiveId(id);
    setHasAnswered(false);
  }

  async function handleAnswer(q: Question, correct: boolean) {
    setHasAnswered(true);
    await progress.recordAnswer(q.id, correct);
    await track("question_answered", {
      question_id: q.id,
      module: q.module,
      skill: q.skill,
      difficulty: q.difficulty,
      time_to_answer_ms: Date.now() - questionShownAt.current,
      correct,
      context: "review",
    });
  }

  if (queue.length === 0 && !activeId) {
    return (
      <AppShell wrongCount={0}>
        <main className="min-h-dvh bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-10 lg:py-16">
            <div className="bg-green-light border border-green-mid rounded-2xl p-8 sm:p-10 text-center animate-fade-up">
              <div className="flex justify-center mb-4">
                <span className="size-16 rounded-full bg-green-mid/60 flex items-center justify-center">
                  <Check
                    size={34}
                    className="text-green-dark"
                    aria-hidden="true"
                  />
                </span>
              </div>
              <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-2">
                All cleared!
              </h1>
              <p className="text-stone-600 text-sm leading-relaxed max-w-sm mx-auto mb-6">
                No mistakes to fix right now. Answer more questions in the
                modules - anything you miss lands here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => router.push("/learn")}
                >
                  Back to practice <ArrowRight size={16} aria-hidden="true" />
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push("/test")}
                >
                  Take the test
                </Button>
              </div>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  // Group by module
  const byModule = modules
    .map((mod) => ({
      mod,
      questions: queue.filter((q) => q.module === mod.id),
    }))
    .filter((g) => g.questions.length > 0);

  return (
    <AppShell wrongCount={queue.length}>
      <main className="min-h-dvh bg-stone-50">
        <div className="max-w-2xl mx-auto px-5 py-6 lg:py-10">
          {activeQ ? (
            <div>
              <button
                onClick={() => {
                  setActiveId(null);
                  setHasAnswered(false);
                }}
                className="text-sm text-stone-400 hover:text-stone-900 mb-4 focus-visible:outline-none cursor-pointer py-2 -my-2 inline-flex items-center gap-1"
              >
                <ArrowLeft size={14} aria-hidden="true" /> Back to list
              </button>
              <QuestionCard
                key={activeQ.id}
                question={activeQ}
                onAnswer={(_optionId, correct) =>
                  handleAnswer(activeQ, correct)
                }
                answered={false}
                selectedId={null}
                hideCorrect={false}
              />
              {hasAnswered &&
                (() => {
                  const nextInModule =
                    queue.find(
                      (q) => q.module === activeQ.module && q.id !== activeQ.id,
                    ) ?? null;
                  return (
                    <div className="mt-4 flex flex-col gap-3">
                      {nextInModule && (
                        <Button
                          variant="primary"
                          size="lg"
                          full
                          onClick={() =>
                            openQuestion(
                              nextInModule.id,
                              queue.indexOf(nextInModule),
                            )
                          }
                        >
                          Next question{" "}
                          <ArrowRight size={16} aria-hidden="true" />
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="lg"
                        full
                        onClick={() => {
                          setActiveId(null);
                          setHasAnswered(false);
                        }}
                      >
                        Back to review
                      </Button>
                    </div>
                  );
                })()}
            </div>
          ) : (
            <>
              {/* Header band */}
              <PageBanner
                title="Review"
                subtitle="Fix your mistakes - answer one right and it leaves the list."
                right={
                  <span className="font-mono text-xs uppercase tracking-wide text-red-dark bg-red-light border border-red-mid rounded-full px-3 py-1.5">
                    {queue.length} to fix
                  </span>
                }
              />

              {/* Grouped by module */}
              {byModule.map(({ mod, questions }, gi) => (
                <div
                  key={mod.id}
                  className="mb-6 animate-fade-up"
                  style={{ animationDelay: `${gi * 80}ms` }}
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <ModuleIcon icon={mod.icon} size="sm" />
                    <h2 className="font-display font-bold text-sm text-stone-900">
                      {mod.title}
                    </h2>
                    <span className="ml-auto font-mono text-xs uppercase tracking-wide text-red-dark">
                      {questions.length} to fix
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {questions.map((q, qi) => (
                      <button
                        key={q.id}
                        onClick={() => openQuestion(q.id, queue.indexOf(q))}
                        className={[
                          "group w-full text-left bg-white border border-stone-200 border-l-[3px] border-l-red rounded-xl px-4 py-3 flex items-start gap-3 cursor-pointer",
                          "hover:border-stone-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
                          "animate-fade-up",
                        ].join(" ")}
                        style={{ animationDelay: `${gi * 80 + qi * 40}ms` }}
                      >
                        <span className="flex-none mt-0.5 size-7 rounded-full bg-red-light text-red-dark flex items-center justify-center">
                          <X size={15} aria-hidden="true" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-stone-900 leading-snug line-clamp-2">
                            {q.prompt}
                          </span>
                          <span className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="font-mono text-[10px] uppercase tracking-wide text-stone-400">
                              {q.skill}
                            </span>
                            <Badge
                              variant={q.difficulty}
                              label={q.difficulty}
                            />
                          </span>
                        </span>
                        <ChevronRight
                          size={18}
                          className="flex-none mt-1 text-stone-400 group-hover:text-orange group-hover:translate-x-0.5 transition-all duration-200"
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
