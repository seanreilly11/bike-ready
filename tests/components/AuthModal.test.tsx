import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthModal from "@/components/layout/AuthModal";

const signInWithGoogle = vi.fn().mockResolvedValue(undefined);
const sendMagicLink = vi.fn().mockResolvedValue(undefined);
const track = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isPremium: false,
    isLoading: false,
    sendMagicLink,
    signInWithGoogle,
    signOut: vi.fn(),
    refreshPremiumStatus: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track, identify: vi.fn() }),
}));

describe("AuthModal sign-in methods", () => {
  beforeEach(() => {
    signInWithGoogle.mockClear();
    sendMagicLink.mockClear();
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

  it("keeps magic link available alongside Google", async () => {
    render(<AuthModal reason="save_progress" onClose={vi.fn()} />);
    await userEvent.type(
      screen.getByPlaceholderText("your@email.com"),
      "rider@example.com",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /send magic link/i }),
    );
    expect(sendMagicLink).toHaveBeenCalledWith(
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
