// Shown while the /learn index streams in. Mirrors the module-list layout
// so the transition doesn't flash an empty frame.
export default function LearnLoading() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-8 animate-pulse" aria-hidden>
      <div className="h-8 w-40 bg-stone-200 rounded-lg mb-2" />
      <div className="h-4 w-64 bg-stone-100 rounded mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-stone-200 rounded-xl p-4">
            <div className="h-5 w-32 bg-stone-200 rounded mb-3" />
            <div className="h-4 w-full bg-stone-100 rounded mb-3" />
            <div className="flex gap-1.5">
              {Array.from({ length: 8 }).map((_, j) => (
                <div key={j} className="size-3 bg-stone-100 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
