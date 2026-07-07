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

describe("OnboardingGate", () => {
  beforeEach(() => {
    push.mockReset();
    getPathname.mockReturnValue("/learn");
    localStorage.clear();
    useUIStore.setState({ onboardingDone: false });
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

  it("deep-links to Fundamentals on complete from the learn index", async () => {
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await user.click(
      await screen.findByRole("button", { name: /start fundamentals/i }),
    );
    expect(push).toHaveBeenCalledWith("/learn/fundamentals");
  });

  it("does not redirect when completed inside a module the user chose", async () => {
    getPathname.mockReturnValue("/learn/priority");
    const user = userEvent.setup();
    render(<OnboardingGate />);
    const cta = await screen.findByRole("button", { name: /let's go/i });
    await user.click(cta);
    expect(push).not.toHaveBeenCalled();
  });

  it("closes without navigating on skip", async () => {
    const user = userEvent.setup();
    render(<OnboardingGate />);
    await user.click(await screen.findByRole("button", { name: /skip/i }));
    expect(push).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
