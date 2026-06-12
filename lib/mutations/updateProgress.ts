import { logError } from "@/lib/logger";

const updateProgress = async (questionId: string, correct: boolean) => {
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id: questionId, correct }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    const err = new Error(data.error || "Failed to update progress");
    logError("updateProgress", err);
    throw err;
  }

  const data = (await res.json()) as { ok?: boolean };
  return data.ok;
};

export default updateProgress;
