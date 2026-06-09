"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useUIStore } from "@/stores/uiStore";
import { X, ChevronRight, ArrowLeft, ArrowRight, Lock, LockOpen, CheckCircle } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import QuestionCard from "@/components/questions/QuestionCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import modules from "@/data/modules";
import { useQuestions } from "@/hooks/useQuestions";

// ─── Free user FOMO screen ────────────────────────────────────────────────────

function FreeReviewScreen() {
  const progress = useProgress();
  const openGate = useUIStore((s) => s.openGate);
  const { allQuestions } = useQuestions();

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
    const skeletonCards = [
      { w1: "75%", w2: "55%", opacityClass: "opacity-100" },
      { w1: "65%", w2: "45%", opacityClass: "opacity-80" },
      { w1: "80%", w2: "50%", opacityClass: "opacity-60" },
    ];

    return (
      <AppShell wrongCount={0}>
        <main className="min-h-dvh bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-6 lg:py-10">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight lg:text-3xl">
                Review
              </h1>
            </div>

            <p className="text-sm text-stone-600 mb-6">
              Answer more questions in the modules and any you get wrong will
              appear here.
            </p>

            <div className="relative">
              {/* Ghost skeleton cards */}
              <div className="flex flex-col gap-3" aria-hidden="true">
                {skeletonCards.map((card, i) => (
                  <div
                    key={i}
                    className={[
                      "bg-white border-[1.5px] border-red-mid border-l-[3px] border-l-red",
                      "rounded-xl px-[15px] py-3 flex items-center gap-3",
                      "blur-sm pointer-events-none select-none",
                      card.opacityClass,
                    ].join(" ")}
                  >
                    <X size={14} className="text-red shrink-0" aria-hidden="true" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="h-3 rounded-full bg-stone-200" style={{ width: card.w1 }} />
                      <div className="h-2.5 rounded-full bg-stone-200" style={{ width: card.w2 }} />
                    </div>
                    <ChevronRight size={16} className="text-stone-400 shrink-0" aria-hidden="true" />
                  </div>
                ))}
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(250,250,248,0.3)] to-[rgba(250,250,248,0.97)] flex flex-col items-center justify-end pb-4 gap-3">
                <Lock size={28} className="text-stone-400" aria-hidden="true" />
                <p className="text-sm text-stone-600 text-center max-w-xs">
                  Answer questions in the modules to build your review list —
                  then unlock to fix them.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={openGate}
                  aria-label="Unlock Review"
                >
                  Unlock
                </Button>
              </div>
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
          <h1 className="font-display text-[26px] font-extrabold tracking-tight text-stone-900 mb-2">
            Fix your mistakes.
          </h1>
          <p className="text-[13px] text-stone-600 leading-relaxed mb-5">
            You have{" "}
            <span className="font-bold text-stone-900">
              {total} question{total !== 1 ? "s" : ""}
            </span>{" "}
            waiting for review. Go premium now to fix them before your next
            ride.
          </p>

          {/* Orange banner */}
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
              onClick={openGate}
              aria-label="Unlock Review"
              className="bg-white text-orange font-bold text-[13px] rounded-full py-1.5 px-3.5 cursor-pointer whitespace-nowrap hover:bg-orange-light transition-colors"
            >
              Unlock <ArrowRight size={14} aria-hidden="true" className="inline" />
            </button>
          </div>

          {/* Blurred question groups */}
          <div className="flex flex-col gap-4 relative">
            {blurredByModule.map(({ mod, qs }, groupIndex) => {
              const groupOpacity =
                groupIndex === 0 ? 1 : groupIndex === 1 ? 0.7 : 0.45;

              return (
                <div key={mod.id} style={{ opacity: groupOpacity }}>
                  {/* Module header — NOT blurred */}
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-display font-bold text-orange flex items-center gap-2">
                      {mod.title}
                    </h2>
                    <span className="font-mono text-[11px] text-orange uppercase tracking-widest">
                      {qs.length} to fix
                    </span>
                  </div>

                  {/* Question cards — blurred */}
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
                          <X size={14} className="text-red shrink-0 mt-px" aria-hidden="true" />
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
                          <ChevronRight size={16} className="text-stone-400 shrink-0 mt-px" aria-hidden="true" />
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
              Unlock to fix {total} mistake{total !== 1 ? "s" : ""}
            </p>
            <p className="font-mono text-[10px] text-stone-400 tracking-wide text-center">
              Less than the fine for running a red light
            </p>
            <button
              onClick={openGate}
              aria-label="Unlock Review for €4.99"
              className="w-full bg-orange text-white font-bold text-[14px] rounded-[10px] py-[11px] px-7 cursor-pointer"
            >
              Unlock for €4.99
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
  const { isPremium } = useAuth();
  const progress = useProgress();
  const { track } = useAnalytics();
  const { allQuestions } = useQuestions();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const queue = progress.getReviewQueue();
  const hadItemsRef = useRef(queue.length > 0);

  useEffect(() => {
    if (queue.length > 0) {
      hadItemsRef.current = true;
    }
  });

  useEffect(() => {
    if (queue.length === 0 && !activeId && hadItemsRef.current) {
      track("review_cleared", {});
    }
  }, [queue.length, activeId]);

  if (!isPremium) {
    return <FreeReviewScreen />;
  }

  // Look up from allQuestions (not queue) so the card stays mounted after a correct
  // answer removes the question from the queue before React commits hasAnswered=true.
  const activeQ = activeId
    ? (allQuestions.find((q) => q.id === activeId) ?? null)
    : null;

  const questionShownAt = useRef<number>(Date.now());

  function openQuestion(id: string, position: number) {
    const question = allQuestions.find((q) => q.id === id);
    if (question) {
      track("review_question_opened", { question_id: question.id, module: question.module, position });
    }
    questionShownAt.current = Date.now();
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
    });
  }

  if (queue.length === 0 && !activeId) {
    return (
      <AppShell wrongCount={0}>
        <main className="min-h-dvh bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-16 text-center animate-fade-up">
            <div className="mb-3 flex justify-center"><CheckCircle size={48} className="text-green" aria-hidden="true" /></div>
            <h1 className="font-display font-bold text-xl text-stone-900 mb-2">
              All cleared
            </h1>
            <p className="text-stone-600 text-sm mb-6">
              No wrong answers to review. Keep learning!
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => router.push("/learn")}
            >
              Back to modules
            </Button>
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight lg:text-3xl">
              Review
            </h1>
            <span className="font-mono text-xs uppercase tracking-wide text-red bg-red-light border border-red-mid rounded-full px-2.5 py-1">
              {queue.length} to fix
            </span>
          </div>

          {/* Hint */}
          <div className="bg-orange-light border border-orange-mid rounded-xl p-3 mb-6 text-sm text-stone-700">
            Get a question right and it disappears. Get it wrong again and it
            stays. Your list shrinks as you fix mistakes.
          </div>

          {activeQ ? (
            <div>
              <button
                onClick={() => {
                  setActiveId(null);
                  setHasAnswered(false);
                }}
                className="text-sm text-stone-400 hover:text-stone-900 mb-4 focus-visible:outline-none cursor-pointer py-2 -my-2 inline-block"
              >
                <ArrowLeft size={14} aria-hidden="true" className="inline mr-1" />Back to list
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
                          onClick={() => openQuestion(nextInModule.id, queue.indexOf(nextInModule))}
                        >
                          Next question <ArrowRight size={16} aria-hidden="true" />
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
            byModule.map(({ mod, questions }) => (
              <div key={mod.id} className="mb-6">
                <h2 className="font-display font-bold text-orange mb-2 flex items-center gap-2">
                  {mod.title}
                </h2>
                <div className="flex flex-col gap-2">
                  {questions.map((q, qi) => (
                    <button
                      key={q.id}
                      onClick={() => openQuestion(q.id, queue.indexOf(q))}
                      className={[
                        "w-full text-left bg-white border-l-[3px] border-l-red border border-stone-200 rounded-xl px-4 py-3 cursor-pointer",
                        "hover:border-l-red hover:shadow-sm transition-all duration-150",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
                        "animate-fade-up",
                      ].join(" ")}
                      style={{ animationDelay: `${qi * 40}ms` }}
                    >
                      <p className="text-sm text-stone-900 leading-relaxed line-clamp-2">
                        {q.prompt}
                      </p>
                      <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mt-1">
                        {q.skill}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </AppShell>
  );
}
