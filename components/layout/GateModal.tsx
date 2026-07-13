"use client";

import { Check, ArrowRight } from "lucide-react";
import type { Module, ModuleId } from "@/types";
import Button from "@/components/ui/Button";
import ModuleIcon from "@/components/ui/ModuleIcon";
import { APP_PRICE, SOCIAL_PROOF } from "@/data/constants";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useModalFocus } from "@/hooks/useModalFocus";

interface GateModalProps {
  moduleId: ModuleId | null;
  moduleName: string | null;
  nextModule: Module | null;
  onUnlock: () => void;
  onNextModule: (id: string) => void;
  onDismiss: () => void;
}

const features = [
  "All questions in every module",
  "Shrinking Review queue",
  "Final Test with results breakdown",
  "Module completion badges",
  "Progress saved across devices",
];

export default function GateModal({
  moduleId,
  moduleName,
  nextModule,
  onUnlock,
  onNextModule,
  onDismiss,
}: GateModalProps) {
  const { track } = useAnalytics();
  const { dialogRef, trapFocus } = useModalFocus(() => {
    track("gate_dismissed", { module: moduleId });
    onDismiss();
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={() => { track('gate_dismissed', { module: moduleId }); onDismiss(); }}
        aria-hidden
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={trapFocus}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-modal-title"
        className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 pb-8 animate-fade-up focus-visible:outline-none"
      >
        {/* Social proof */}
        <div className="flex justify-center mb-4">
          <span className="font-mono text-xs uppercase tracking-wide bg-orange-light text-orange border border-orange-mid rounded-full px-3 py-1">
            {SOCIAL_PROOF}
          </span>
        </div>

        <h2 id="gate-modal-title" className="font-display font-extrabold text-2xl text-stone-900 text-center mb-2">
          {moduleName ? `Want to finish ${moduleName}?` : "Want the full course?"}
        </h2>
        <p className="text-stone-600 text-sm text-center mb-5">
          Unlock the full course once and keep it forever.
        </p>

        {/* Feature list */}
        <ul className="space-y-2 mb-6">
          {features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2 text-sm text-stone-700"
            >
              <Check size={16} className="text-green shrink-0" aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>

        {/* Next module nudge */}
        {nextModule && (
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ModuleIcon icon={nextModule.icon} size="sm" />
              <div>
                <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-0.5">
                  Or try next
                </p>
                <p className="font-display font-bold text-stone-900">
                  {nextModule.title}
                </p>
              </div>
            </div>
            <button
              onClick={() => { track('gate_next_module_clicked', { from_module: moduleId, to_module: nextModule.id as ModuleId }); onNextModule(nextModule.id); }}
              className="text-sm font-display font-bold text-orange hover:underline whitespace-nowrap focus-visible:outline-none"
            >
              Try it <ArrowRight size={14} aria-hidden="true" className="inline" />
            </button>
          </div>
        )}

        <Button variant="primary" size="lg" full onClick={() => { track('upgrade_cta_clicked', { source: 'gate_modal' }); onUnlock(); }}>
          Unlock for {APP_PRICE}
        </Button>
        <p className="text-center text-xs text-stone-400 mt-2">
          Less than the fine for running a red light
        </p>

        <div className="flex justify-center mt-4">
          <Button variant="ghost" size="sm" onClick={() => { track('gate_dismissed', { module: moduleId }); onDismiss(); }}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
