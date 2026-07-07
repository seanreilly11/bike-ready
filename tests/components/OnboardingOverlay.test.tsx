const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track, identify: vi.fn() }),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingOverlay from "@/components/layout/OnboardingOverlay";
import { useUIStore } from "@/stores/uiStore";

function renderOverlay(
  overrides: Partial<{
    ctaLabel: string;
    onComplete: () => void;
    onSkip: () => void;
  }> = {},
) {
  const onComplete = overrides.onComplete ?? vi.fn();
  const onSkip = overrides.onSkip ?? vi.fn();
  render(
    <OnboardingOverlay
      ctaLabel={overrides.ctaLabel ?? "Start Fundamentals"}
      onComplete={onComplete}
      onSkip={onSkip}
    />,
  );
  return { onComplete, onSkip };
}

describe("OnboardingOverlay", () => {
  beforeEach(() => {
    track.mockReset();
    localStorage.clear();
    useUIStore.setState({ onboardingDone: false });
  });

  it("is a single screen with no Next step", () => {
    renderOverlay();
    expect(
      screen.queryByRole("button", { name: /^next$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start fundamentals/i }))
      .toBeInTheDocument();
  });

  it("mentions that no account is needed", () => {
    renderOverlay();
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument();
  });

  it("tracks onboarding_started on mount", () => {
    renderOverlay();
    expect(track).toHaveBeenCalledWith("onboarding_started", {});
  });

  it("moves focus into the dialog on open", () => {
    renderOverlay();
    const dialog = screen.getByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("completes: marks done, tracks, and calls onComplete", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderOverlay();
    await user.click(
      screen.getByRole("button", { name: /start fundamentals/i }),
    );
    expect(track).toHaveBeenCalledWith("onboarding_completed", {});
    expect(useUIStore.getState().onboardingDone).toBe(true);
    expect(localStorage.getItem("onboarding_done")).toBe("true");
    expect(onComplete).toHaveBeenCalled();
  });

  it("skips via the Skip button: marks done and calls onSkip", async () => {
    const user = userEvent.setup();
    const { onSkip, onComplete } = renderOverlay();
    await user.click(screen.getByRole("button", { name: /skip/i }));
    expect(track).toHaveBeenCalledWith("onboarding_skipped", {});
    expect(useUIStore.getState().onboardingDone).toBe(true);
    expect(onSkip).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("skips via Escape", async () => {
    const user = userEvent.setup();
    const { onSkip } = renderOverlay();
    await user.keyboard("{Escape}");
    expect(onSkip).toHaveBeenCalled();
    expect(useUIStore.getState().onboardingDone).toBe(true);
  });

  it("traps Tab focus inside the dialog", async () => {
    const user = userEvent.setup();
    renderOverlay();
    const dialog = screen.getByRole("dialog");
    // Tab through every focusable element; focus must stay in the dialog
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });
});
