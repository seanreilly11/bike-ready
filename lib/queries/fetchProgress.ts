const fetchProgress = async () => {
  const res = await fetch("/api/progress");
  if (res.status === 401) return null;
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to load progress");
  }
  return data.progress;
};

export default fetchProgress;
