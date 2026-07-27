import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { useAppStore } from "@/stores/appStore";

// Reset store state between tests
function resetStore() {
  useAppStore.setState({
    progress: {},
    earned: [],
    user: null,
    isPremium: false,
  });
}

describe("appStore", () => {
  beforeEach(resetStore);

  describe("answerQuestion", () => {
    it("marks a question as seen and records correctness", () => {
      useAppStore.getState().answerQuestion("q1", true);
      const p = useAppStore.getState().progress["q1"];
      expect(p.seen).toBe(true);
      expect(p.correct).toBe(true);
    });

    it("marks a question as seen when answered wrong", () => {
      useAppStore.getState().answerQuestion("q1", false);
      const p = useAppStore.getState().progress["q1"];
      expect(p.seen).toBe(true);
      expect(p.correct).toBe(false);
    });

    it("last answer wins: once correct, reverts to wrong when re-answered wrong", () => {
      useAppStore.getState().answerQuestion("q1", true);
      useAppStore.getState().answerQuestion("q1", false);
      expect(useAppStore.getState().progress["q1"].correct).toBe(false);
    });

    it("last answer wins: wrong then correct upgrades to correct", () => {
      useAppStore.getState().answerQuestion("q1", false);
      useAppStore.getState().answerQuestion("q1", true);
      expect(useAppStore.getState().progress["q1"].correct).toBe(true);
    });

    it("does not mutate other question entries", () => {
      useAppStore.getState().answerQuestion("q1", true);
      useAppStore.getState().answerQuestion("q2", false);
      expect(useAppStore.getState().progress["q1"].correct).toBe(true);
      expect(useAppStore.getState().progress["q2"].correct).toBe(false);
    });
  });

  describe("earnBadge", () => {
    it("adds a badge id to earned", () => {
      useAppStore.getState().earnBadge("badge_priority");
      expect(useAppStore.getState().earned).toContain("badge_priority");
    });

    it("is idempotent - duplicate earn does not duplicate the entry", () => {
      useAppStore.getState().earnBadge("badge_priority");
      useAppStore.getState().earnBadge("badge_priority");
      const earned = useAppStore.getState().earned;
      expect(earned.filter((id) => id === "badge_priority")).toHaveLength(1);
    });

    it("can earn multiple distinct badges", () => {
      useAppStore.getState().earnBadge("badge_priority");
      useAppStore.getState().earnBadge("badge_signs");
      expect(useAppStore.getState().earned).toHaveLength(2);
    });
  });

  describe("hydrateProgress", () => {
    it("merges server rows without dropping existing local progress", () => {
      useAppStore.getState().answerQuestion("q1", true);
      useAppStore.getState().hydrateProgress({ q2: { seen: true, correct: false } });
      const progress = useAppStore.getState().progress;
      expect(progress["q1"]).toEqual({ seen: true, correct: true });
      expect(progress["q2"]).toEqual({ seen: true, correct: false });
    });

    it("does not downgrade a locally-correct answer to wrong", () => {
      useAppStore.getState().answerQuestion("q1", true);
      useAppStore.getState().hydrateProgress({ q1: { seen: true, correct: false } });
      expect(useAppStore.getState().progress["q1"].correct).toBe(true);
    });

    it("upgrades a locally-wrong answer when the server row is correct", () => {
      useAppStore.getState().answerQuestion("q1", false);
      useAppStore.getState().hydrateProgress({ q1: { seen: true, correct: true } });
      expect(useAppStore.getState().progress["q1"].correct).toBe(true);
    });
  });

  describe("resetProgress", () => {
    it("clears progress and earned", () => {
      useAppStore.getState().answerQuestion("q1", true);
      useAppStore.getState().earnBadge("badge_priority");
      useAppStore.getState().resetProgress();
      expect(useAppStore.getState().progress).toEqual({});
      expect(useAppStore.getState().earned).toEqual([]);
    });

    it("does not clear user or isPremium", () => {
      useAppStore.setState({ isPremium: true });
      useAppStore.getState().resetProgress();
      expect(useAppStore.getState().isPremium).toBe(true);
    });
  });

  describe("setUser / setPremium", () => {
    it("sets user", () => {
      const fakeUser = {
        id: "u1",
        email: "test@example.com",
      } as unknown as User;
      useAppStore.getState().setUser(fakeUser);
      expect(useAppStore.getState().user).toEqual(fakeUser);
    });

    it("sets isPremium true", () => {
      useAppStore.getState().setPremium(true);
      expect(useAppStore.getState().isPremium).toBe(true);
    });

    it("sets isPremium false", () => {
      useAppStore.setState({ isPremium: true });
      useAppStore.getState().setPremium(false);
      expect(useAppStore.getState().isPremium).toBe(false);
    });
  });

  describe("persist partialize", () => {
    it("store name is store and only persists progress + earned", () => {
      useAppStore.setState({ isPremium: true });
      useAppStore.getState().answerQuestion("persist_test", true);
      useAppStore.getState().earnBadge("badge_priority");
      const raw = localStorage.getItem("store");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed).toHaveProperty("state");
      // partialize should include progress and earned
      expect(parsed.state).toHaveProperty("progress");
      expect(parsed.state).toHaveProperty("earned");
      // partialize should exclude user and isPremium
      expect(parsed.state).not.toHaveProperty("user");
      expect(parsed.state).not.toHaveProperty("isPremium");
    });
  });
});
