import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ModuleSessionPage from "@/app/learn/[moduleId]/page";
import { useAppStore } from "@/stores/appStore";
import { activeQuestions } from "@/hooks/useQuestions";
import { FREE_PER_MODULE } from "@/types";

const authState = {
  user: null as never,
  isPremium: false,
  isLoading: true,
  sendMagicLink: vi.fn(),
  signOut: vi.fn(),
  refreshPremiumStatus: vi.fn(),
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/learn/priority",
  useParams: () => ({ moduleId: "priority" }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/config", () => ({ PREMIUM_ENABLED: true }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => authState }));
vi.mock("@/hooks/useUnlock", () => ({ useUnlock: () => vi.fn() }));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

describe("module gate during auth load", () => {
  it("does not show the gate while auth is still resolving", () => {
    useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false });
    const priority = activeQuestions.filter((q) => q.module === "priority");
    for (const q of priority.slice(0, FREE_PER_MODULE)) {
      useAppStore.getState().answerQuestion(q.id, true);
    }
    render(<ModuleSessionPage />);
    expect(screen.queryByText(/free preview complete/i)).not.toBeInTheDocument();
  });
});
