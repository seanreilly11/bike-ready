const updateProgress = async (
  questionId: string,
  correct: boolean,
  userId?: string,
) => {
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question_id: questionId, correct, user_id: userId }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Failed to update progress:", data.error);
    throw new Error(data.error || "Failed to update progress");
  } else {
    return data.ok;
  }
};

export default updateProgress;
