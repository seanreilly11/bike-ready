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
import { activeQuestions } from "@/hooks/useQuestions";
import modules from "@/data/modules";

const TEST_TOTAL = modules.length * 3;

// The test set is sampled at random inside TestPage on mount, so this test
// can't precompute it via a separate buildTestSet() call - that call would
// draw a different sample. Instead, look up the currently rendered question
// by its prompt text (unique per active question) to find the right answer.
function findCurrentQuestion(promptEl: Element) {
  const promptText = promptEl.textContent;
  const question = activeQuestions.find((q) => q.prompt === promptText);
  if (!question) {
    throw new Error(`No active question matches rendered prompt: ${promptText}`);
  }
  return question;
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
    const { container } = render(<TestPage />);

    await user.click(screen.getByRole("button", { name: /start test/i }));

    for (let i = 0; i < TEST_TOTAL; i++) {
      const promptEl = container.querySelector("p.font-display.text-base");
      if (!promptEl) {
        throw new Error("Question prompt not found in rendered output");
      }
      const question = findCurrentQuestion(promptEl);
      const correctOption = question.options.find(
        (o) => o.id === question.correct,
      )!;
      await user.click(screen.getByText(correctOption.label));
      if (i + 1 < TEST_TOTAL) {
        await user.click(
          screen.getByRole("button", { name: /next question/i }),
        );
      } else {
        await user.click(screen.getByRole("button", { name: /see results/i }));
      }
    }

    // Results screen shows the pass state and the master badge is earned
    expect(await screen.findByText("100%")).toBeInTheDocument();
    expect(useAppStore.getState().earned).toContain("badge_master");
  }, 30_000);
});
