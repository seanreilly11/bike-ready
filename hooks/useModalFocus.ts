"use client";

import { useEffect, useRef } from "react";

// Focus management for modal dialogs: moves focus into the dialog on mount,
// restores the previously focused element on unmount, calls onEscape for the
// Escape key, and keeps Tab cycling inside the dialog.
//
// Usage: const { dialogRef, trapFocus } = useModalFocus(onClose)
//        <div ref={dialogRef} tabIndex={-1} role="dialog" onKeyDown={trapFocus}>
export function useModalFocus(onEscape: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Latest-callback ref so the mount-once Escape listener never goes stale
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscapeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, []);

  function trapFocus(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === dialogRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return { dialogRef, trapFocus };
}
