import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthModal from "@/components/layout/AuthModal";

const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
const sendMagicLink = vi.fn().mockResolvedValue(undefined);
const verifyEmailOtp = vi.fn().mockResolvedValue(undefined);
const track = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isPremium: false,
    isLoading: false,
    sendMagicLink,
    verifyEmailOtp,
    signInWithGoogle,
    signOut: vi.fn(),
    refreshPremiumStatus: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track, identify: vi.fn() }),
}));

async function sendCodeTo(email: string) {
  await userEvent.type(screen.getByPlaceholderText("your@email.com"), email);
  await userEvent.click(screen.getByRole("button", { name: /email me a code/i }));
}

describe("AuthModal sign-in methods", () => {
  beforeEach(() => {
    signInWithGoogle.mockClear();
    sendMagicLink.mockClear();
    verifyEmailOtp.mockClear();
    track.mockClear();
  });

  it("starts Google OAuth with the modal's reason", async () => {
    render(<AuthModal reason="upgrade" onClose={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /continue with google/i }),
    );
    expect(signInWithGoogle).toHaveBeenCalledWith("upgrade");
    expect(track).toHaveBeenCalledWith("oauth_started", {
      provider: "google",
      reason: "upgrade",
    });
  });

  it("keeps email sign-in available alongside Google", async () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    await sendCodeTo("rider@example.com");
    expect(sendMagicLink).toHaveBeenCalledWith(
      "rider@example.com",
      "save_progress",
    );
  });

  it("asks for the emailed code instead of waiting on a link click", async () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    await sendCodeTo("rider@example.com");
    expect(screen.getByLabelText(/sign-in code/i)).toBeInTheDocument();
  });

  it("signs in with the typed code", async () => {
    const onClose = vi.fn();
    render(<AuthModal reason="save_progress" onClose={onClose} />);
    await sendCodeTo("rider@example.com");
    await userEvent.type(screen.getByLabelText(/sign-in code/i), "123456");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(verifyEmailOtp).toHaveBeenCalledWith("rider@example.com", "123456");
    expect(onClose).toHaveBeenCalled();
  });

  // Supabase's Email OTP Length is a per-project setting (6-10 digits), so the
  // input must not assume the 6-digit default - truncating an 8-digit code
  // silently made every sign-in fail.
  it("accepts a code longer than six digits", async () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    await sendCodeTo("rider@example.com");
    await userEvent.type(screen.getByLabelText(/sign-in code/i), "04916802");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(verifyEmailOtp).toHaveBeenCalledWith("rider@example.com", "04916802");
  });

  it("keeps the code step usable after a rejected code", async () => {
    verifyEmailOtp.mockRejectedValueOnce(new Error("expired"));
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    await sendCodeTo("rider@example.com");
    await userEvent.type(screen.getByLabelText(/sign-in code/i), "000000");
    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    expect(await screen.findByText(/didn't work/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sign-in code/i)).toBeEnabled();
  });

  it("resends a fresh code on request", async () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    await sendCodeTo("rider@example.com");
    await userEvent.click(screen.getByRole("button", { name: /send a new code/i }));
    expect(sendMagicLink).toHaveBeenCalledTimes(2);
    expect(sendMagicLink).toHaveBeenLastCalledWith(
      "rider@example.com",
      "save_progress",
    );
  });

  it("recovers from a failed Google redirect", async () => {
    signInWithGoogle.mockRejectedValueOnce(new Error("popup blocked"));
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /continue with google/i });
    await userEvent.click(btn);
    expect(await screen.findByText(/couldn't sign in with google/i)).toBeInTheDocument();
    // Button must be usable again, not stuck in its loading state
    expect(
      screen.getByRole("button", { name: /continue with google/i }),
    ).toBeEnabled();
  });
});

describe("AuthModal focus management", () => {
  it("moves focus into the dialog on open", () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    render(<AuthModal reason="save_progress" onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps Tab inside the dialog", async () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog");
    // Tab far more times than there are focusables - focus must stay inside
    for (let i = 0; i < 12; i++) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});
