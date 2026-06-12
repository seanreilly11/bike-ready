// Shown while a module session streams in. Approximates the dot map +
// question card so navigation into a module doesn't flash an empty frame.
export default function ModuleLoading() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-8 animate-pulse" aria-hidden>
      <div className="flex gap-1.5 mb-8 justify-center">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="size-3 bg-stone-200 rounded-full" />
        ))}
      </div>
      <div className="border border-stone-200 rounded-2xl p-6">
        <div className="h-4 w-24 bg-stone-100 rounded mb-4" />
        <div className="h-6 w-full bg-stone-200 rounded mb-2" />
        <div className="h-6 w-3/4 bg-stone-200 rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 w-full bg-stone-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
