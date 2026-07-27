import { logError } from "@/lib/logger";

// Records a completed test attempt. The server derives passed from the score.
const saveTestResult = async (
  scorePct: number,
  answers: Record<string, string>,
): Promise<void> => {
  const res = await fetch("/api/test-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ score_pct: scorePct, answers }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const err = new Error(data.error || "Failed to save test result");
    logError("saveTestResult", err);
    throw err;
  }
};

export default saveTestResult;
