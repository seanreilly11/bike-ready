// Shown while a module session streams in. Mirrors the real layout: the sticky
// sub-header (back + title + progress) and the StudyLayout body — reading column
// on mobile, reading column + context rail on desktop.
export default function ModuleLoading() {
  return (
    <div className="animate-pulse min-h-dvh bg-stone-50" aria-hidden>
      {/* Sub-header */}
      <div className="bg-white border-b border-stone-200 py-3">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-4 bg-stone-200 rounded" />
            <div className="h-4 w-32 bg-stone-200 rounded" />
            <div className="ml-auto h-3 w-10 bg-stone-100 rounded" />
          </div>
          <div className="h-1.5 w-full bg-stone-200 rounded-full" />
        </div>
      </div>

      {/* Body — matches StudyLayout */}
      <div className="mx-auto max-w-2xl lg:max-w-5xl px-5 py-6 lg:py-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,640px)_300px] lg:justify-center lg:gap-10 lg:items-start">
          {/* Reading column */}
          <div className="min-w-0">
            {/* Dot map — mobile only (rail shows progress on desktop) */}
            <div className="flex flex-wrap gap-2 mb-6 lg:hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="size-3 bg-stone-200 rounded-full" />
              ))}
            </div>

            {/* Metadata row */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-28 bg-stone-100 rounded" />
              <div className="h-5 w-16 bg-stone-100 rounded-full" />
            </div>

            {/* Lesson accordion — mobile only */}
            <div className="h-12 w-full bg-stone-100 rounded-xl mb-3 lg:hidden" />

            {/* Prompt card */}
            <div className="border border-stone-200 rounded-xl p-4 mb-3 bg-white">
              <div className="h-5 w-full bg-stone-200 rounded mb-2" />
              <div className="h-5 w-2/3 bg-stone-200 rounded" />
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 w-full bg-stone-100 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Context rail — desktop only */}
          <div className="hidden lg:block">
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className="h-3 w-28 bg-stone-100 rounded mb-2" />
              <div className="h-5 w-32 bg-stone-200 rounded mb-2" />
              <div className="h-5 w-16 bg-stone-100 rounded-full mb-4" />
              <div className="h-4 w-24 bg-stone-200 rounded mb-2" />
              <div className="space-y-1.5 mb-4">
                <div className="h-3 w-full bg-stone-100 rounded" />
                <div className="h-3 w-full bg-stone-100 rounded" />
                <div className="h-3 w-3/4 bg-stone-100 rounded" />
              </div>
              <div className="border-t border-stone-200 mb-4" />
              <div className="h-3 w-24 bg-stone-100 rounded mb-2" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="size-3 bg-stone-200 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
