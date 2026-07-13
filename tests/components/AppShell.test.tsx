import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppShell from "@/components/layout/AppShell";
import { useUIStore } from "@/stores/uiStore";

vi.mock("next/navigation", () => ({
  usePathname: () => "/review",
  useRouter: () => ({ push: vi.fn() }),
}));
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
vi.mock("@/hooks/useUnlock", () => ({ useUnlock: () => vi.fn() }));
vi.mock("@/hooks/useAnalytics", () => ({
  useAnalytics: () => ({ track: vi.fn(), identify: vi.fn() }),
}));

describe("AppShell gate modal", () => {
  beforeEach(() => {
    useUIStore.setState({ showGate: false, gateModuleId: null, showAuth: false });
  });

  it("renders GateModal when the gate is opened without a module", () => {
    useUIStore.getState().openGate();
    render(<AppShell>content</AppShell>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Want the full course?")).toBeInTheDocument();
  });

  it("renders module-specific copy when opened with a module", () => {
    useUIStore.getState().openGate("priority");
    render(<AppShell>content</AppShell>);
    expect(screen.getByText("Want to finish Priority Rules?")).toBeInTheDocument();
  });

  it("closes on Not now", async () => {
    const user = userEvent.setup();
    useUIStore.getState().openGate();
    render(<AppShell>content</AppShell>);
    await user.click(screen.getByRole("button", { name: /not now/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
