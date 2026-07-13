"use client";

import { X } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAnalytics } from "@/hooks/useAnalytics";

interface ReturnBannerProps {
  onDismiss: () => void;
  seenCount: number;
}

export default function ReturnBanner({
  onDismiss,
  seenCount,
}: ReturnBannerProps) {
  const openAuth = useUIStore((s) => s.openAuth);
  const { track } = useAnalytics();

  return (
    <div className="bg-orange-light border-b border-orange-mid">
      <div className="max-w-5xl mx-auto px-5 py-2.5 flex items-center justify-between gap-3 text-sm">
        <p className="text-stone-700">
          <span className="font-bold text-stone-900">
            {seenCount} answer{seenCount === 1 ? "" : "s"}
          </span>{" "}
          saved only on this device -{" "}
          <button
            onClick={() => {
              track("return_banner_clicked", {});
              openAuth("save_progress");
            }}
            className="font-bold text-orange underline underline-offset-2 hover:no-underline focus-visible:outline-none cursor-pointer"
          >
            sign in
          </button>{" "}
          to keep them.
        </p>
        <button
          onClick={() => {
            track("return_banner_dismissed", {});
            onDismiss();
          }}
          className="shrink-0 text-stone-400 hover:text-stone-900 transition-colors p-2.5 -m-2.5 focus-visible:outline-none cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
