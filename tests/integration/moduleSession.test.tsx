// vi.mock calls are hoisted by vitest - must appear before imports
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ moduleId: "fundamentals" }),
  usePathname: () => "/learn/fundamentals",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/mutations/updateProgress", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/queries/fetchProgress", () => ({
  default: vi.fn().mockResolvedValue([]),
}));

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModuleSessionPage from "@/app/learn/[moduleId]/page";
import { useAppStore } from "@/stores/appStore";
import { activeQuestions } from "@/hooks/useQuestions";
import { FREE_PER_MODULE } from "@/types";

// Get fundamentals questions for assertions
const fundamentalsQuestions = activeQuestions.filter(
  (q) => q.module === "fundamentals",
);

describe("ModuleSessionPage - fundamentals module session", () => {
  beforeEach(() => {
    // Reset store to pristine state before each test
    useAppStore.getState().resetProgress();
    useAppStore.getState().setUser(null);
    useAppStore.getState().setPremium(false);
  });

  it("renders the first question prompt", () => {
    render(<ModuleSessionPage />);
    expect(
      screen.getByText(fundamentalsQuestions[0].prompt),
    ).toBeInTheDocument();
  });

  it("shows feedback panel after selecting an answer", async () => {
    const user = userEvent.setup();
    render(<ModuleSessionPage />);

    const q0 = fundamentalsQuestions[0];
    const correctOption = q0.options.find((o) => o.id === q0.correct);
    expect(correctOption).toBeDefined();
    if (!correctOption) return; // Type narrowing - correctOption is always defined per data schema

    await user.click(screen.getByText(correctOption.label));

    await waitFor(() => {
      expect(screen.getByText(q0.feedback.body)).toBeInTheDocument();
    });
  });

  it("shows Next question button after answering", async () => {
    const user = userEvent.setup();
    render(<ModuleSessionPage />);

    const q0 = fundamentalsQuestions[0];
    // Click the first option (any answer reveals the button)
    await user.click(screen.getByText(q0.options[0].label));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /next question|complete module/i }),
      ).toBeInTheDocument();
    });
  });

  it("advances to the second question after clicking Next", async () => {
    const user = userEvent.setup();
    render(<ModuleSessionPage />);

    const q0 = fundamentalsQuestions[0];
    const q1 = fundamentalsQuestions[1];

    // Answer question 0
    await user.click(screen.getByText(q0.options[0].label));

    // Wait for Next button to appear then click it
    const nextBtn = await screen.findByRole("button", {
      name: /next question|complete module/i,
    });
    await user.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText(q1.prompt)).toBeInTheDocument();
    });
  });

  it("fundamentals module is never gated even after FREE_PER_MODULE answers", async () => {
    // Pre-answer FREE_PER_MODULE questions from fundamentals
    for (let i = 0; i < FREE_PER_MODULE; i++) {
      useAppStore.getState().answerQuestion(fundamentalsQuestions[i].id, true);
    }

    render(<ModuleSessionPage />);

    // The gate screen shows "Free preview complete" - must NOT be visible
    expect(
      screen.queryByText(/free preview complete/i),
    ).not.toBeInTheDocument();

    // No upgrade / unlock CTA should be present
    expect(screen.queryByText(/unlock/i)).not.toBeInTheDocument();
  });
});
