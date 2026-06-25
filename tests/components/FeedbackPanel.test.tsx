import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import FeedbackPanel from "@/components/questions/FeedbackPanel";
import { AnswerResult } from "@/types";
import type { Question } from "@/types";

const feedback = {
  body: "Cyclists always have priority on a fietspad.",
  rule: "RVV 1990 article 15.",
  tip: "Look for the red surface - that is your lane.",
};

const mockQuestion: Question = {
  id: "priority_001",
  module: "priority",
  skill: "Right Before Left",
  difficulty: "easy",
  type: "true_false",
  prompt: "Test prompt",
  options: [
    { id: "a", label: "True" },
    { id: "b", label: "False" },
  ],
  correct: "a",
  feedback: { body: feedback.body, rule: feedback.rule, tip: feedback.tip },
  status: "active",
};

describe("FeedbackPanel", () => {
  it("shows AnswerResult.Correct label when correct=true", () => {
    render(
      <FeedbackPanel
        feedback={feedback}
        correct={true}
        question={mockQuestion}
      />,
    );
    expect(screen.getByText(AnswerResult.Correct)).toBeInTheDocument();
  });

  it("shows AnswerResult.Wrong label when correct=false", () => {
    render(
      <FeedbackPanel
        feedback={feedback}
        correct={false}
        question={mockQuestion}
      />,
    );
    expect(screen.getByText(AnswerResult.Wrong)).toBeInTheDocument();
  });

  it("does not show Wrong label when correct=true", () => {
    render(
      <FeedbackPanel
        feedback={feedback}
        correct={true}
        question={mockQuestion}
      />,
    );
    expect(screen.queryByText(AnswerResult.Wrong)).not.toBeInTheDocument();
  });

  it("does not show Correct label when correct=false", () => {
    render(
      <FeedbackPanel
        feedback={feedback}
        correct={false}
        question={mockQuestion}
      />,
    );
    expect(screen.queryByText(AnswerResult.Correct)).not.toBeInTheDocument();
  });

  it("renders feedback body text", () => {
    render(
      <FeedbackPanel
        feedback={feedback}
        correct={true}
        question={mockQuestion}
      />,
    );
    expect(screen.getByText(feedback.body)).toBeInTheDocument();
  });

  it("renders rule text", () => {
    render(
      <FeedbackPanel
        feedback={feedback}
        correct={true}
        question={mockQuestion}
      />,
    );
    expect(screen.getByText(feedback.rule)).toBeInTheDocument();
  });

  it("renders tip text", () => {
    render(
      <FeedbackPanel
        feedback={feedback}
        correct={true}
        question={mockQuestion}
      />,
    );
    expect(screen.getByText(feedback.tip)).toBeInTheDocument();
  });

  it("applies green styling when correct", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={feedback}
        correct={true}
        question={mockQuestion}
      />,
    );
    expect(container.firstChild).toHaveClass("bg-green-light");
  });

  it("applies red styling when wrong", () => {
    const { container } = render(
      <FeedbackPanel
        feedback={feedback}
        correct={false}
        question={mockQuestion}
      />,
    );
    expect(container.firstChild).toHaveClass("bg-red-light");
  });
});
