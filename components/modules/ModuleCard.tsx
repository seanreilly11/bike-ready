"use client";

import type { Module, ModuleStatus } from "@/types";
import { FREE_PER_MODULE } from "@/types";
import Badge from "@/components/ui/Badge";
import MasteryDot from "@/components/ui/MasteryDot";
import { useAppStore } from "@/stores/appStore";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

const statusBadge: Record<
  ModuleStatus,
  { label: string; variant: "easy" | "medium" | "hard" | "earned" | "locked" }
> = {
  not_started: { label: "Not started", variant: "locked" },
  in_progress: { label: "In progress", variant: "medium" },
  complete: { label: "Complete", variant: "easy" },
  preview_done: { label: "Preview done", variant: "hard" },
};

export default function ModuleCard({ module, onClick }: ModuleCardProps) {
  const progress = useAppStore((s) => s.progress);
  const isPremium = useAppStore((s) => s.isPremium);
  const { getModuleStatus } = useProgress();
  const { questionsByModule } = useQuestions();
  const questions = questionsByModule(module.id);
  const status = getModuleStatus(module.id, isPremium);
  const seen = questions.filter((q) => progress[q.id]?.seen).length;
  const { label, variant } = statusBadge[status];

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left bg-white border border-stone-200 rounded-xl p-4 cursor-pointer",
        "hover:border-stone-400 hover:shadow-md transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
        "active:scale-[0.99]",
        module.alwaysFree
          ? "border-l-4 border-l-green hover:border-l-green"
          : "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-orange">{module.title}</h3>
        </div>
        <Badge variant={variant} label={label} />
      </div>

      {/* Description */}
      <p className="text-sm text-stone-600 mb-3">{module.description}</p>

      {/* Dot map */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {questions.map((q, i) => {
          const isGated =
            !module.alwaysFree && !isPremium && i >= FREE_PER_MODULE;
          const p = progress[q.id];
          const state = p?.correct ? "correct" : p?.seen ? "seen" : "unseen";
          return (
            <div key={q.id} style={{ opacity: isGated ? 0.35 : 1 }}>
              <MasteryDot state={state} />
            </div>
          );
        })}
      </div>

      {/* Count */}
      <p className="font-mono text-xs uppercase tracking-wide text-stone-400">
        {seen} / {questions.length} seen
      </p>
    </button>
  );
}
