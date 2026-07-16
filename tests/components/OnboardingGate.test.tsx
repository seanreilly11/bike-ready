const { push, getPathname } = vi.hoisted(() => ({
  push: vi.fn(),
  getPathname: vi.fn(() => "/learn"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  usePathname: () => getPathname(),
}));

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingGate from "@/components/layout/OnboardingGate";
import { useUIStore } from "@/stores/uiStore";

async function completeWizard(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: /get started/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await user.click(screen.getByRole("button", { name: /continue/i }));
  await user.click(
    screen.getByRole("button", { name: /start with fundamentals/i }),
  );
}

describe("OnboardingGate", () => {
  beforeEach(() => {
    push.mockReset();
    getPathname.mockReturnValue("/learn");
    localStorage.clear();
    useUIStore.setState({
      onboardingDone: false,
      riderProfile: null,
      ridingTimeline: null,
    });
  });

  it("shows the overlay on a first visit to /learn", async () => {
    render(<OnboardingGate />);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("shows nothing when onboarding was already completed", () => {
    localStorage.setItem("onboarding_done", "true");
    render(<OnboardingGate />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deep-links to the mapped module on complete (default -> fundamentals)", async () => {
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await completeWizard(user);
    expect(push).toHaveBeenCalledWith("/learn/fundamentals");
  });

  it("navigates to the mapped module even when opened inside another module", async () => {
    getPathname.mockReturnValue("/learn/legal");
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await completeWizard(user);
    expect(push).toHaveBeenCalledWith("/learn/fundamentals");
  });

  it("closes without navigating on skip", async () => {
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await user.click(await screen.findByRole("button", { name: /^skip$/i }));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
