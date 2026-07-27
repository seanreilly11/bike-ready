const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track, identify: vi.fn() }),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingOverlay from "@/components/layout/OnboardingOverlay";
import { useUIStore } from "@/stores/uiStore";
import type { ModuleId } from "@/types";

function renderOverlay(
  overrides: Partial<{
    onComplete: (moduleId: ModuleId) => void;
    onSkip: () => void;
  }> = {},
) {
  const onComplete = overrides.onComplete ?? vi.fn();
  const onSkip = overrides.onSkip ?? vi.fn();
  render(<OnboardingOverlay onComplete={onComplete} onSkip={onSkip} />);
  return { onComplete, onSkip };
}

async function advance(user: ReturnType<typeof userEvent.setup>) {
  // step 0 -> 1
  await user.click(screen.getByRole("button", { name: /get started/i }));
}

describe("OnboardingOverlay wizard", () => {
  beforeEach(() => {
    track.mockReset();
    localStorage.clear();
    useUIStore.setState({
      onboardingDone: false,
      riderProfile: null,
      ridingTimeline: null,
    });
  });

  it("opens on the intro step with no choice pills yet", () => {
    renderOverlay();
    expect(screen.getByText(/welcome to cycledutch/i)).toBeInTheDocument();
    expect(screen.getByText(/no account needed/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /just moved here/i }),
    ).not.toBeInTheDocument();
  });

  it("tracks onboarding_started on mount", () => {
    renderOverlay();
    expect(track).toHaveBeenCalledWith("onboarding_started", {});
  });

  it("moves focus into the dialog on open", () => {
    renderOverlay();
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(
      true,
    );
  });

  it("defaults the situation pill to Just moved here", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await advance(user);
    expect(
      screen.getByRole("button", { name: /just moved here/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("completes with defaults: fundamentals + this_month", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderOverlay();
    await advance(user); // -> situation
    await user.click(screen.getByRole("button", { name: /continue/i })); // -> timeline
    await user.click(screen.getByRole("button", { name: /continue/i })); // -> plan
    await user.click(
      screen.getByRole("button", { name: /start with fundamentals/i }),
    );
    expect(track).toHaveBeenCalledWith("onboarding_profile_selected", {
      profile: "just_moved",
      timeline: "this_month",
    });
    expect(track).toHaveBeenCalledWith("onboarding_completed", {});
    expect(onComplete).toHaveBeenCalledWith("fundamentals");
    expect(useUIStore.getState().onboardingDone).toBe(true);
    expect(localStorage.getItem("rider_profile")).toBe("just_moved");
  });

  it("routes a commuter riding this week to Priority Rules", async () => {
    const user = userEvent.setup();
    const { onComplete } = renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /commute daily/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /this week/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(
      screen.getByRole("button", { name: /start with priority rules/i }),
    );
    expect(onComplete).toHaveBeenCalledWith("priority");
    expect(track).toHaveBeenCalledWith("onboarding_profile_selected", {
      profile: "commuter",
      timeline: "this_week",
    });
  });

  it("Back preserves the situation selection", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /commute daily/i }));
    await user.click(screen.getByRole("button", { name: /continue/i })); // timeline
    await user.click(screen.getByRole("button", { name: /back/i })); // situation
    expect(
      screen.getByRole("button", { name: /commute daily/i }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("Skip on the situation step records step 1", async () => {
    const user = userEvent.setup();
    const { onSkip, onComplete } = renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(track).toHaveBeenCalledWith("onboarding_skipped", { step: 1 });
    expect(onSkip).toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("skipping on the final step records step 3", async () => {
    const user = userEvent.setup();
    const { onSkip } = renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(track).toHaveBeenCalledWith("onboarding_skipped", { step: 3 });
    expect(onSkip).toHaveBeenCalled();
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
    for (let i = 0; i < 5; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
  });

  it("renders the personalized plan line for the chosen answers", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /commute daily/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /this week/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByText(
        /right-of-way is where most near-misses happen[\s\S]*you ride this week/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows the all-free line for an always-free target module", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText(/the essentials, all free/i)).toBeInTheDocument();
  });

  it("Escape records the step the user was on", async () => {
    const user = userEvent.setup();
    renderOverlay();
    await advance(user);
    await user.click(screen.getByRole("button", { name: /continue/i })); // step 2
    await user.keyboard("{Escape}");
    expect(track).toHaveBeenCalledWith("onboarding_skipped", { step: 2 });
  });
});
