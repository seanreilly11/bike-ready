import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useQuestions, activeQuestions } from "@/hooks/useQuestions";
import modules from "@/data/modules";
import type { ModuleId } from "@/types";

describe("activeQuestions", () => {
  it('contains only questions with status "active"', () => {
    const nonActive = activeQuestions.filter((q) => q.status !== "active");
    expect(nonActive).toHaveLength(0);
  });

  it("contains at least one question", () => {
    expect(activeQuestions.length).toBeGreaterThan(0);
  });
});

describe("useQuestions", () => {
  describe("questionsByModule", () => {
    it("returns only questions belonging to the requested module", () => {
      const { result } = renderHook(() => useQuestions());
      const qs = result.current.questionsByModule("priority");
      expect(qs.every((q) => q.module === "priority")).toBe(true);
    });

    it("returns a non-empty array for each defined module", () => {
      const { result } = renderHook(() => useQuestions());
      for (const mod of modules) {
        const qs = result.current.questionsByModule(mod.id as ModuleId);
        expect(
          qs.length,
          `${mod.id} should have active questions`,
        ).toBeGreaterThan(0);
      }
    });
  });

  describe("buildTestSet", () => {
    it("returns questions from all modules", () => {
      const { result } = renderHook(() => useQuestions());
      const testSet = result.current.buildTestSet();
      const moduleIds = new Set(testSet.map((q) => q.module));
      expect(moduleIds.size).toBe(modules.length);
    });

    it("returns exactly 3 questions per module with no duplicates", () => {
      const { result } = renderHook(() => useQuestions());
      const testSet = result.current.buildTestSet();
      const ids = new Set(testSet.map((q) => q.id));
      expect(ids.size).toBe(testSet.length);
      for (const mod of modules) {
        const count = testSet.filter((q) => q.module === mod.id).length;
        expect(count, `${mod.id} should have exactly 3 in test set`).toBe(3);
      }
    });

    it("only returns active questions from the module bank", () => {
      const { result } = renderHook(() => useQuestions());
      const activeIds = new Set(activeQuestions.map((q) => q.id));
      for (const q of result.current.buildTestSet()) {
        expect(activeIds.has(q.id)).toBe(true);
      }
    });
  });
});
