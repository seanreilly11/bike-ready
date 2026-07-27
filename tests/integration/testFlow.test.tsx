import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TestPage from "@/app/test/page";
import { useAppStore } from "@/stores/appStore";
import { useUIStore } from "@/stores/uiStore";

const authState = {
  user: { id: "u1", email: "a@b.com" } as never,
  isPremium: true,
  isLoading: false,
  sendMagicLink: vi.fn(),
  signOut: vi.fn(),
  refreshPremiumStatus: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/test",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/config", () => ({ PREMIUM_ENABLED: true }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));
vi.mock("@/lib/mutations/saveTestResult", () => ({
  default: vi.fn(async () => undefined),
}));
vi.mock("@/hooks/useQuestions", () => {
  const q = (id: string, module: string) => ({
    id,
    module,
    skill: "Skill",
    difficulty: "easy",
    type: "true_false",
    prompt: `Prompt ${id}`,
    options: [
      { id: "a", label: "True" },
      { id: "b", label: "False" },
    ],
    correct: "a",
    feedback: { title: "Correct", body: "b", rule: "r", tip: "t" },
    status: "active",
  });
  const q1 = q("fundamentals_001", "fundamentals");
  const q2 = q("priority_001", "priority");
  const all = [q1, q2];
  return {
    activeQuestions: all,
    useQuestions: () => ({
      allQuestions: all,
      totalQuestions: all.length,
      questionsByModule: (m: string) => all.filter((x) => x.module === m),
      buildTestSet: () => all,
    }),
  };
});

describe("test flow", () => {
  beforeEach(() => {
    useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: true });
    useUIStore.setState({ newBadgeId: null });
  });

  it("requires an explicit 'See results' click after the last question", async () => {
    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByRole("button", { name: /start test/i }));

    await user.click(screen.getByRole("button", { name: /false/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));

    await user.click(screen.getByRole("button", { name: /false/i }));
    // Still on the question - results only after the explicit click
    expect(screen.queryByText(/not quite there yet/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /see results/i }));
    expect(screen.getByText(/not quite there yet/i)).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("resets question state on retry so the first question is answerable", async () => {
    const user = userEvent.setup();
    render(<TestPage />);
    await user.click(screen.getByRole("button", { name: /start test/i }));
    await user.click(screen.getByRole("button", { name: /false/i }));
    await user.click(screen.getByRole("button", { name: /next question/i }));
    await user.click(screen.getByRole("button", { name: /false/i }));
    await user.click(screen.getByRole("button", { name: /see results/i }));

    await user.click(screen.getByRole("button", { name: /try again/i }));
    await user.click(screen.getByRole("button", { name: /start test/i }));

    // Without the reset, the first question mounts already-answered:
    // options disabled and a premature Next button visible.
    expect(
      screen.queryByRole("button", { name: /next question/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /true/i })).toBeEnabled();
  });

  it("shows neither test nor upsell while auth is loading", () => {
    authState.isPremium = false;
    authState.isLoading = true;
    render(<TestPage />);
    expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start test/i }),
    ).not.toBeInTheDocument();
    authState.isPremium = true;
    authState.isLoading = false;
  });
});
