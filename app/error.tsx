"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <p className="text-4xl mb-4">🚲</p>
      <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">
        Something went wrong
      </h1>
      <p className="text-stone-500 mb-8 max-w-sm">
        An unexpected error occurred. Your progress is safe.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
        >
          Try again
        </button>
        <a
          href="/learn"
          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-100 transition-colors"
        >
          Back to modules
        </a>
      </div>
    </div>
  );
}
