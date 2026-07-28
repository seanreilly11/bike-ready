import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import LearnIndexPage from "@/app/learn/page";
import { useAppStore } from "@/stores/appStore";
import { activeQuestions } from "@/hooks/useQuestions";
import { FREE_PER_MODULE } from "@/types";
import modules from "@/data/modules";

// The user returning from the Paddle overlay is, by construction, the user who
// just hit the preview-complete wall — that screen is where the CTA lives. The
// webhook has usually not landed yet, so the store still says isPremium: false.
const searchParams = { current: new URLSearchParams() };
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/learn",
  useParams: () => ({}),
  useRouter: () => ({ push: vi.fn(), replace }),
  useSearchParams: () => searchParams.current,
}));

const verifyPremium = vi.fn().mockResolvedValue(true);
vi.mock("@/lib/mutations/verifyPremium", () => ({
  default: () => verifyPremium(),
}));

vi.mock("@/lib/config", () => ({ PREMIUM_ENABLED: true }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1" },
    isPremium: false,
    isLoading: false,
    sendMagicLink: vi.fn(),
    signOut: vi.fn(),
    refreshPremiumStatus: vi.fn(),
  }),
}));
const unlock = vi.fn();
vi.mock("@/hooks/useUnlock", () => ({ useUnlock: () => unlock }));
vi.mock("@/hooks/usePaddle", () => ({ usePaddle: () => ({ Checkout: {} }) }));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

// Answer the free allowance in every gated module -> isPreviewComplete === true.
function makePreviewComplete() {
  useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false });
  for (const mod of modules.filter((m) => !m.alwaysFree)) {
    const qs = activeQuestions.filter((q) => q.module === mod.id);
    for (const q of qs.slice(0, FREE_PER_MODULE)) {
      useAppStore.getState().answerQuestion(q.id, true);
    }
  }
}

describe("returning from Paddle checkout at the preview-complete wall", () => {
  beforeEach(() => {
    verifyPremium.mockClear();
    unlock.mockClear();
    replace.mockClear();
  });

  it("reconciles premium on ?upgraded=true", async () => {
    makePreviewComplete();
    searchParams.current = new URLSearchParams("upgraded=true");

    render(<LearnIndexPage />);

    await waitFor(() => expect(verifyPremium).toHaveBeenCalled());
  });

  it("opens the Paddle overlay on ?checkout=1 after an upgrade magic link", async () => {
    makePreviewComplete();
    searchParams.current = new URLSearchParams("checkout=1");

    render(<LearnIndexPage />);

    await waitFor(() => expect(unlock).toHaveBeenCalled());
  });
});
