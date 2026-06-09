"use client";

import type { Module, ModuleStatus } from "@/types";
import { FREE_PER_MODULE } from "@/types";
import MasteryDot from "@/components/ui/MasteryDot";
import Badge from "@/components/ui/Badge";
import { useAppStore } from "@/stores/appStore";
import { useQuestions } from "@/hooks/useQuestions";
import { useProgress } from "@/hooks/useProgress";
import { colors } from "@/lib/tokens";
import { PREMIUM_ENABLED } from "@/lib/config";

interface ModuleCardProps {
  module: Module;
  onClick: () => void;
}

type BadgeVariant =
  | "easy"
  | "medium"
  | "hard"
  | "earned"
  | "locked"
  | "mastered";

const statusBadge: Record<
  ModuleStatus,
  { label: string; variant: BadgeVariant }
> = {
  not_started: { label: "Not started", variant: "locked" },
  in_progress: { label: "In progress", variant: "medium" },
  complete: { label: "Complete", variant: "easy" },
  preview_done: { label: "Preview done", variant: "hard" },
  mastered: { label: "Mastered", variant: "mastered" },
};

export default function ModuleCard({ module, onClick }: ModuleCardProps) {
  const progress = useAppStore((s) => s.progress);
  const isPremium = useAppStore((s) => s.isPremium);
  const { getModuleStatus } = useProgress();
  const { questionsByModule } = useQuestions();
  const questions = questionsByModule(module.id);
  const status = getModuleStatus(module.id, isPremium);
  const seen = questions.filter((q) => progress[q.id]?.seen).length;

  const borderLeft =
    status === "mastered"
      ? "3px solid #f5a623"
      : status === "complete"
        ? `3px solid ${colors.green}`
        : status === "in_progress"
          ? `3px solid ${colors.orange}`
          : module.alwaysFree && PREMIUM_ENABLED
            ? `3px solid ${colors.green}`
            : `1px solid ${colors.stone200}`;

  const bg = status === "mastered" ? "#fffdf0" : "white";

  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left border border-stone-200 rounded-xl p-4 cursor-pointer",
        "hover:border-stone-400 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2",
        "active:scale-[0.99]",
      ].join(" ")}
      style={{ borderLeft, background: bg }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-display font-bold text-orange">{module.title}</h3>
        {/* {status === "mastered" ? (
          <span
            style={{
              background:    "#fef3c7",
              color:         "#92400e",
              fontFamily:    "DM Mono, monospace",
              fontSize:      9,
              padding:       "2px 7px",
              borderRadius:  99,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              display:       "inline-flex",
              alignItems:    "center",
              gap:           4,
              whiteSpace:    "nowrap",
            }}
          >
            <svg
              viewBox="0 0 10 10"
              fill="#92400e"
              style={{ width: 9, height: 9 }}
              aria-hidden="true"
            >
              <polygon points="5,1 6.2,3.8 9.5,4.1 7.1,6.2 7.9,9.5 5,7.8 2.1,9.5 2.9,6.2 0.5,4.1 3.8,3.8" />
            </svg>
            Mastered
          </span>
        ) : ( */}
        <Badge
          variant={statusBadge[status].variant}
          label={statusBadge[status].label}
        />
        {/* )} */}
      </div>

      {/* Description */}
      <p className="text-sm text-stone-600 mb-3">{module.description}</p>

      {/* Dot map */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {questions.map((q, i) => {
          const isGated =
            !module.alwaysFree && !isPremium && i >= FREE_PER_MODULE;
          const p = progress[q.id];
          const state = isGated
            ? "locked"
            : p?.correct
              ? "correct"
              : p?.seen
                ? "seen"
                : "unseen";
          return <MasteryDot key={q.id} state={state} />;
        })}
      </div>

      {/* Count */}
      <p className="font-mono text-xs uppercase tracking-wide text-stone-400">
        {seen} / {questions.length} seen
      </p>
    </button>
  );
}
