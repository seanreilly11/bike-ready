"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { AuthModalReason } from "@/stores/uiStore";

const CODE_LENGTH = 6;

interface EmailCodeFormProps {
  email: string;
  reason: AuthModalReason;
  onDone: () => void;
}

/**
 * Second step of email sign-in: the user types the 6-digit code from the email
 * so the session lands in THIS tab. The emailed link still works as a fallback
 * for anyone who taps it out of habit.
 */
export default function EmailCodeForm({
  email,
  reason,
  onDone,
}: EmailCodeFormProps) {
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { verifyEmailOtp, sendMagicLink } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await verifyEmailOtp(email, code);
      track("login_code_verified", { reason });
      // Close before navigating: the session already exists at this point, so
      // nothing that happens after may re-render this as a rejected code.
      onDone();
      if (reason === "upgrade") {
        // Same hand-off the magic-link callback uses: PostAuthCheckout on
        // /learn opens the Paddle overlay once Paddle.js is ready.
        router.push("/learn?checkout=1");
      } else {
        // Server components read the session from cookies, so they keep
        // rendering the signed-out view until the router re-fetches them.
        router.refresh();
      }
    } catch {
      track("login_code_failed", { reason });
      setError("That code didn't work. Check it or send a new one.");
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    try {
      await sendMagicLink(email, reason);
      track("magic_link_sent", { reason });
      setCode("");
      setResent(true);
    } catch {
      setError("Couldn't send a new code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="text-center py-2">
      <div className="mb-3 flex justify-center">
        <MailCheck size={40} className="text-orange" aria-hidden="true" />
      </div>
      <h2
        id="auth-modal-title"
        className="font-display font-extrabold text-xl text-stone-900 mb-2"
      >
        Check your email
      </h2>
      <p className="text-stone-600 text-sm mb-5">
        We sent a {CODE_LENGTH}-digit code to <strong>{email}</strong>. Enter it
        below to stay right here.
      </p>

      <form onSubmit={handleVerify} className="space-y-3">
        <label htmlFor="login-code" className="sr-only">
          {CODE_LENGTH}-digit code
        </label>
        <input
          id="login-code"
          type="text"
          inputMode="numeric"
          // Lets iOS/Android offer the code straight from the notification.
          autoComplete="one-time-code"
          autoFocus
          required
          maxLength={CODE_LENGTH}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))
          }
          placeholder="000000"
          className={[
            "w-full rounded-xl border px-4 py-3",
            "font-mono text-center text-2xl tracking-[0.4em] text-stone-900",
            "placeholder:text-stone-300 placeholder:tracking-[0.4em]",
            "border-stone-200 focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30",
            "transition-colors duration-150",
          ].join(" ")}
        />
        {error && <p className="text-red-dark text-xs">{error}</p>}
        {!error && resent && (
          <p className="text-xs text-stone-400">
            New code sent. The old one no longer works.
          </p>
        )}
        <Button
          type="submit"
          full
          loading={verifying}
          disabled={verifying || code.length < CODE_LENGTH}
        >
          {verifying ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || verifying}
        className="mt-4 text-xs text-stone-400 underline hover:text-stone-600 disabled:no-underline disabled:opacity-60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange rounded"
      >
        {resending ? "Sending…" : "Send a new code"}
      </button>

      <p className="text-xs text-stone-400 mt-3">
        The email also has a sign-in link if you&apos;d rather tap that.
      </p>
    </div>
  );
}
