// vi.mock calls are hoisted by vitest - must appear before imports
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/test",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/mutations/updateProgress", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/queries/fetchProgress", () => ({
  default: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/config", () => ({ PREMIUM_ENABLED: true }));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    isPremium: true,
    isLoading: false,
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
    refreshPremiumStatus: vi.fn(),
  }),
}));

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TestPage from "@/app/test/page";
import { useAppStore } from "@/stores/appStore";
import { useUIStore } from "@/stores/uiStore";
import { useQuestions } from "@/hooks/useQuestions";
import { renderHook } from "@testing-library/react";

function getTestSet() {
  const { result } = renderHook(() => useQuestions());
  return result.current.buildTestSet();
}

describe("TestPage - passing the test", () => {
  beforeEach(() => {
    useAppStore.getState().resetProgress();
    useAppStore.getState().setUser(null);
    useAppStore.getState().setPremium(true);
    useUIStore.getState().clearBadge();
  });

  it("awards badge_master after answering every question correctly", async () => {
    const user = userEvent.setup();
    const testSet = getTestSet();
    render(<TestPage />);

    await user.click(screen.getByRole("button", { name: /start test/i }));

    for (let i = 0; i < testSet.length; i++) {
      const q = testSet[i];
      const correctOption = q.options.find((o) => o.id === q.correct)!;
      await user.click(screen.getByText(correctOption.label));
      if (i + 1 < testSet.length) {
        await user.click(
          screen.getByRole("button", { name: /next question/i }),
        );
      }
    }

    // Results screen shows the pass state and the master badge is earned
    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(useAppStore.getState().earned).toContain("badge_master");
  }, 30_000);
});
