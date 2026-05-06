"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AuthModalReason } from "@/stores/uiStore";

interface AuthModalProps {
  reason: AuthModalReason;
  onClose: () => void;
}

const copy: Record<AuthModalReason, { title: string; body: string; note?: string }> = {
  save_progress: {
    title: "Save your progress",
    body: "Enter your email and we'll send a magic link. No password needed.",
  },
  upgrade: {
    title: "Create a free account to unlock",
    body: "We need your email to complete your purchase. Takes 30 seconds.",
    note: "Use the same email you've been using on this device.",
  },
};

export default function AuthModal({ reason, onClose }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { sendMagicLink } = useAuth();
  const { track } = useAnalytics();
  const { title, body, note } = copy[reason];

  useEffect(() => {
    track('auth_modal_opened', { reason, source: reason });
  }, [reason, track]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await sendMagicLink(email, reason);
      track('magic_link_sent', { reason });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-up">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-stone-400 hover:text-stone-900 transition-colors p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded-lg"
          aria-label="Close"
        >
          ✕
        </button>

        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">📬</div>
            <h2 className="font-display font-bold text-xl text-stone-900 mb-2">
              Check your email
            </h2>
            <p className="text-stone-600 text-sm">
              We sent a magic link to <strong>{email}</strong>. Click it to sign
              in.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-xl text-stone-900 mb-1">
              {title}
            </h2>
            <p className="text-stone-600 text-sm mb-5">{body}</p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={[
                  "w-full rounded-xl border px-4 py-3 text-sm font-display text-stone-900",
                  "placeholder:text-stone-400",
                  "border-stone-200 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30",
                  "transition-colors duration-150",
                ].join(" ")}
              />
              {note && (
                <p className="text-xs text-stone-400">{note}</p>
              )}
              {error && <p className="text-red-dark text-xs">{error}</p>}
              <Button
                type="submit"
                full
                loading={loading}
                disabled={loading || !email}
              >
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>

            <p className="text-center text-xs text-stone-400 mt-4">
              No password. One click to sign in.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
