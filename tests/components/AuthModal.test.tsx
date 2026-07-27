import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthModal from "@/components/layout/AuthModal";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isPremium: false,
    isLoading: false,
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
    refreshPremiumStatus: vi.fn(),
  }),
}));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

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
