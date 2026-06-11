"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/types";
import { TEST_PASS_PCT } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useProgress } from "@/hooks/useProgress";
import { useBadges } from "@/hooks/useBadges";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Trophy, RotateCcw, ArrowRight, Check, X, LockOpen } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import QuestionCard from "@/components/questions/QuestionCard";
import FeedbackPanel from "@/components/questions/FeedbackPanel";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import modules from "@/data/modules";
import { useQuestions } from "@/hooks/useQuestions";
import { useUIStore } from "@/stores/uiStore";

// ─── Free user FOMO screen ────────────────────────────────────────────────────

function FreeTestScreen() {
  const openGate = useUIStore((s) => s.openGate);
  const { buildTestSet } = useQuestions();
  const testSet = buildTestSet();

  return (
    <AppShell wrongCount={0}>
      <main className="min-h-dvh bg-stone-50 pb-40">
        {/* Blurred intro content */}
        <div
          aria-hidden="true"
          className="blur-sm pointer-events-none select-none"
        >
          <div className="max-w-2xl mx-auto px-5 py-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4"><Trophy size={48} className="text-yellow-500" aria-hidden="true" /></div>
              <h1 className="font-display font-extrabold text-3xl text-stone-900 tracking-tight mb-3">
                BikeReady Test
              </h1>
              <p className="text-stone-600 text-base leading-relaxed max-w-md mx-auto">
                {testSet.length} questions across all modules. Feedback is
                withheld until the results screen. Score ≥{TEST_PASS_PCT}% to
                earn the BikeReady badge.
              </p>
            </div>
            <div className="grid gap-3 mb-8">
              {[
                {
                  label: "Questions",
                  value: `${testSet.length} mixed questions`,
                },
                { label: "Feedback", value: "Shown after all questions" },
                { label: "Pass mark", value: `${TEST_PASS_PCT}% or above` },
                { label: "Badge", value: "BikeReady on pass" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3"
                >
                  <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                    {row.label}
                  </span>
                  <span className="font-display text-sm text-stone-900">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <Button full size="lg" onClick={() => {}}>
              Start Test <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Sticky bottom CTA */}
        <div className="sticky bottom-0 text-center bg-gradient-to-b from-transparent to-[rgba(250,250,248,0.95)] pt-10 -mt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="inline-flex flex-col items-center gap-2.5 bg-white border border-stone-200 rounded-2xl px-5 py-[18px] shadow-lg min-w-[260px]">
            <LockOpen size={24} className="text-stone-500" aria-hidden="true" />
            <p className="font-display font-bold text-[15px] text-stone-900 tracking-tight leading-snug text-center">
              Unlock to take the BikeReady Test
            </p>
            <p className="font-mono text-[10px] text-stone-400 tracking-wide text-center">
              Less than the fine for running a red light
            </p>
            <button
              onClick={openGate}
              aria-label="Unlock for €4.99"
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

type Phase = "intro" | "questions" | "results";

interface Answer {
  question: Question;
  selectedId: string;
  correct: boolean;
}

export default function TestPage() {
  const router = useRouter();
  const { isPremium } = useAuth();
  const progress = useProgress();
  const { checkModuleBadge } = useBadges();
  const { track } = useAnalytics();
  const { buildTestSet } = useQuestions();

  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const testSet = buildTestSet();

  const abandonRef = useRef({ phase, answeredCount: answers.length, totalCount: testSet.length });
  const questionShownAt = useRef<number>(0);

  useEffect(() => {
    abandonRef.current = { phase, answeredCount: answers.length, totalCount: testSet.length };
  });

  useEffect(() => {
    return () => {
      const { phase: p, answeredCount, totalCount } = abandonRef.current;
      if (p === "questions") {
        track("test_abandoned", {
          progress_pct: Math.round((answeredCount / totalCount) * 100),
          questions_answered: answeredCount,
        });
      }
    };
  }, [track]);

  useEffect(() => {
    questionShownAt.current = Date.now();
  }, [index]);

  if (!isPremium) {
    return <FreeTestScreen />;
  }

  const reviewQueue = progress.getReviewQueue();

  // -------------------------------------------------------------------------
  // Intro phase
  // -------------------------------------------------------------------------
  if (phase === "intro") {
    return (
      <AppShell wrongCount={reviewQueue.length}>
        <main className="min-h-dvh bg-stone-50">
          <div className="max-w-2xl mx-auto px-5 py-10">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4"><Trophy size={48} className="text-yellow-500" aria-hidden="true" /></div>
              <h1 className="font-display font-extrabold text-3xl text-stone-900 tracking-tight mb-3">
                BikeReady Test
              </h1>
              <p className="text-stone-600 text-base leading-relaxed max-w-md mx-auto">
                {testSet.length} questions across all modules. Feedback is
                withheld until the results screen. Score ≥{TEST_PASS_PCT}% to
                earn the BikeReady badge.
              </p>
            </div>

            <div className="grid gap-3 mb-8">
              {[
                {
                  label: "Questions",
                  value: `${testSet.length} mixed questions`,
                },
                {
                  label: "Feedback",
                  value: "Shown after all questions",
                },
                {
                  label: "Pass mark",
                  value: `${TEST_PASS_PCT}% or above`,
                },
                {
                  label: "Badge",
                  value: "BikeReady on pass",
                },
              ].map((row, i) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3 animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                    {row.label}
                  </span>
                  <span className="font-display text-sm text-stone-900">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            <Button full size="lg" onClick={() => { track("test_started", {}); setPhase("questions"); }}>
              Start Test <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </main>
      </AppShell>
    );
  }

  // -------------------------------------------------------------------------
  // Questions phase
  // -------------------------------------------------------------------------
  const currentQ = testSet[index];

  async function handleAnswer(optionId: string, correct: boolean) {
    setSelectedId(optionId);
    setSubmitted(true);

    const newAnswer: Answer = {
      question: currentQ,
      selectedId: optionId,
      correct,
    };

    // Record progress in background
    await progress.recordAnswer(currentQ.id, correct);
    await track("question_answered", {
      question_id: currentQ.id,
      module: currentQ.module,
      skill: currentQ.skill,
      difficulty: currentQ.difficulty,
      correct,
      time_to_answer_ms: Date.now() - questionShownAt.current,
      context: "test",
    });
    await checkModuleBadge(currentQ.module);

    if (index + 1 >= testSet.length) {
      // Last question — go to results
      const allAnswers = [...answers, newAnswer];
      setAnswers(allAnswers);
      const scorePct = Math.round(
        (allAnswers.filter((a) => a.correct).length / allAnswers.length) * 100,
      );
      await track("test_completed", {
        score_pct: scorePct,
        passed: scorePct >= TEST_PASS_PCT,
      });
      setPhase("results");
    } else {
      setAnswers((prev) => [...prev, newAnswer]);
    }
  }

  function handleNext() {
    setSubmitted(false);
    setSelectedId(null);
    setIndex((i) => i + 1);
  }

  if (phase === "questions") {
    const pct = Math.round((index / testSet.length) * 100);

    return (
      <AppShell wrongCount={reviewQueue.length}>
        <main className="min-h-dvh bg-stone-50">
          {/* Progress header */}
          <div className="sticky top-14 z-30 bg-white border-b border-stone-200 px-5 py-3">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                  Question {index + 1} / {testSet.length}
                </span>
                <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
                  {pct}%
                </span>
              </div>
              <ProgressBar value={pct} color="orange" height={3} />
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-5 py-6">
            <QuestionCard
              key={currentQ.id}
              question={currentQ}
              onAnswer={handleAnswer}
              answered={submitted}
              selectedId={selectedId}
              hideCorrect // no feedback in Test mode
            />

            {submitted && index + 1 < testSet.length && (
              <div className="mt-4 animate-fade-up">
                <Button full size="lg" onClick={handleNext}>
                  Next question <ArrowRight size={16} aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </main>
      </AppShell>
    );
  }

  // -------------------------------------------------------------------------
  // Results phase
  // -------------------------------------------------------------------------
  const correctCount = answers.filter((a) => a.correct).length;
  const scorePct = Math.round((correctCount / answers.length) * 100);
  const passed = scorePct >= TEST_PASS_PCT;
  const wrongAnswers = answers.filter((a) => !a.correct);

  // Per-module breakdown
  const moduleBreakdown = modules
    .map((mod) => {
      const modAnswers = answers.filter((a) => a.question.module === mod.id);
      const modCorrect = modAnswers.filter((a) => a.correct).length;
      return {
        mod,
        correct: modCorrect,
        total: modAnswers.length,
        pct:
          modAnswers.length > 0
            ? Math.round((modCorrect / modAnswers.length) * 100)
            : 0,
      };
    })
    .filter((b) => b.total > 0);

  function handleShare() {
    const text = `I scored ${scorePct}% on the BikeReady Test! 🚲 Ready to cycle in the Netherlands.`;
    if (navigator.share) {
      track("test_share_clicked", { score_pct: scorePct, passed, platform: "native" });
      navigator.share({ text, url: "https://bikeready.app" }).catch(() => {});
    } else {
      track("test_share_clicked", { score_pct: scorePct, passed, platform: "clipboard" });
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <AppShell wrongCount={reviewQueue.length}>
      <main className="min-h-dvh bg-stone-50">
        <div className="max-w-2xl mx-auto px-5 py-8 lg:py-12">
          {/* Score hero */}
          <div
            className={[
              "rounded-2xl p-6 text-center mb-6 animate-fade-up",
              passed
                ? "bg-green-light border border-green-mid"
                : "bg-red-light border border-red-mid",
            ].join(" ")}
          >
            <div className="flex justify-center mb-3">
              {passed ? <Trophy size={48} className="text-yellow-500" aria-hidden="true" /> : <RotateCcw size={48} className="text-stone-500" aria-hidden="true" />}
            </div>
            <p className="font-display font-extrabold text-4xl sm:text-5xl text-stone-900 mb-1">
              {scorePct}%
            </p>
            <p
              className={[
                "font-display font-bold text-lg mb-2",
                passed ? "text-green-dark" : "text-red-dark",
              ].join(" ")}
            >
              {passed ? "BikeReady!" : "Not quite there yet"}
            </p>
            <p className="text-stone-600 text-sm">
              {correctCount} of {answers.length} correct
              {!passed && ` — need ${TEST_PASS_PCT}% to pass`}
            </p>

            {passed && (
              <button
                onClick={handleShare}
                className="mt-4 inline-flex items-center gap-2 bg-white border border-green-mid text-green-dark rounded-xl px-4 py-2 text-sm font-display font-bold hover:bg-green-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
              >
                Share result <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Module breakdown */}
          <div className="mb-8">
            <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
              By module
            </h2>
            <div className="space-y-3">
              {moduleBreakdown.map(({ mod, correct, total, pct: modPct }, i) => (
                <div
                  key={mod.id}
                  className="bg-white border border-stone-200 rounded-xl px-4 py-3 animate-fade-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-medium text-stone-900 flex items-center gap-1.5">
                      {mod.emoji} {mod.title}
                    </span>
                    <span className="font-mono text-xs text-stone-400">
                      {correct}/{total}
                    </span>
                  </div>
                  <ProgressBar
                    value={modPct}
                    color={modPct >= TEST_PASS_PCT ? "green" : "orange"}
                    height={4}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Wrong answer review */}
          {wrongAnswers.length > 0 && (
            <div className="mb-8">
              <h2 className="font-display font-bold text-lg text-stone-900 mb-3">
                Review — {wrongAnswers.length} wrong
              </h2>
              <div className="space-y-4">
                {wrongAnswers.map(({ question, selectedId: sid }, i) => (
                  <div
                    key={question.id}
                    className="bg-white border border-stone-200 rounded-xl p-4 animate-fade-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <p className="text-sm text-stone-900 leading-relaxed mb-3">
                      {question.prompt}
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {question.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={[
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border",
                            opt.id === question.correct
                              ? "bg-green-light border-green text-green-dark"
                              : opt.id === sid
                                ? "bg-red-light border-red text-red-dark"
                                : "bg-white border-stone-200 text-stone-400",
                          ].join(" ")}
                        >
                          <span className="font-mono text-xs">{opt.id}</span>
                          <span className="flex-1">{opt.label}</span>
                          {opt.id === question.correct && (
                            <Check size={15} aria-hidden="true" />
                          )}
                          {opt.id === sid && opt.id !== question.correct && (
                            <X size={15} aria-hidden="true" />
                          )}
                        </div>
                      ))}
                    </div>
                    <FeedbackPanel
                      feedback={question.feedback}
                      correct={false}
                      question={question}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!passed && (
              <Button
                full
                size="lg"
                onClick={() => {
                  track("test_retried", { previous_score_pct: scorePct });
                  setPhase("intro");
                  setAnswers([]);
                  setIndex(0);
                }}
              >
                Try again <ArrowRight size={16} aria-hidden="true" />
              </Button>
            )}
            <Button
              full
              variant="secondary"
              size="lg"
              onClick={() => router.push("/learn")}
            >
              Back to modules
            </Button>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
