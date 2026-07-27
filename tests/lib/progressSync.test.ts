import { describe, expect, it } from "vitest";
import { mergeProgress, progressToUpload } from "@/lib/utils/progress";
import type { LocalProgress } from "@/types";

describe("mergeProgress", () => {
  it("unions entries from both sides", () => {
    const local: LocalProgress = { q1: { seen: true, correct: true } };
    const server: LocalProgress = { q2: { seen: true, correct: false } };
    expect(mergeProgress(local, server)).toEqual({
      q1: { seen: true, correct: true },
      q2: { seen: true, correct: false },
    });
  });

  it("ORs seen and correct when both sides have the same question", () => {
    const local: LocalProgress = { q1: { seen: true, correct: false } };
    const server: LocalProgress = { q1: { seen: true, correct: true } };
    expect(mergeProgress(local, server)).toEqual({
      q1: { seen: true, correct: true },
    });
  });

  it("keeps a local correct answer when the server row is wrong", () => {
    const local: LocalProgress = { q1: { seen: true, correct: true } };
    const server: LocalProgress = { q1: { seen: true, correct: false } };
    expect(mergeProgress(local, server).q1.correct).toBe(true);
  });

  it("returns server rows untouched when local is empty", () => {
    const server: LocalProgress = { q1: { seen: true, correct: true } };
    expect(mergeProgress({}, server)).toEqual(server);
  });
});

describe("progressToUpload", () => {
  it("returns local entries missing from the server", () => {
    const local: LocalProgress = {
      q1: { seen: true, correct: true },
      q2: { seen: true, correct: false },
    };
    expect(progressToUpload(local, {})).toEqual([
      { questionId: "q1", correct: true },
      { questionId: "q2", correct: false },
    ]);
  });

  it("returns a local correct entry when the server row is not yet correct", () => {
    const local: LocalProgress = { q1: { seen: true, correct: true } };
    const server: LocalProgress = { q1: { seen: true, correct: false } };
    expect(progressToUpload(local, server)).toEqual([
      { questionId: "q1", correct: true },
    ]);
  });

  it("skips entries the server already has with equal or better state", () => {
    const local: LocalProgress = {
      q1: { seen: true, correct: false },
      q2: { seen: true, correct: true },
    };
    const server: LocalProgress = {
      q1: { seen: true, correct: true },
      q2: { seen: true, correct: true },
    };
    expect(progressToUpload(local, server)).toEqual([]);
  });

  it("skips unseen local entries", () => {
    const local: LocalProgress = { q1: { seen: false, correct: false } };
    expect(progressToUpload(local, {})).toEqual([]);
  });

  it("returns nothing when local is empty", () => {
    expect(progressToUpload({}, { q1: { seen: true, correct: true } })).toEqual([]);
  });
});
