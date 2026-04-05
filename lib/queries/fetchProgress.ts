const fetchProgress = async () => {
  const res = await fetch("/api/progress");
  const data = await res.json();
  if (!res.ok) {
    console.error("Failed to load progress:", data.error);
    throw new Error(data.error || "Failed to load progress");
  } else {
    return data.progress;
  }
};

export default fetchProgress;
