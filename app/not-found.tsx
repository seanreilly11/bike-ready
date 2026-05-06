import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-50 px-6 text-center">
      <p className="text-4xl mb-4">🗺️</p>
      <h1 className="font-display text-2xl font-bold text-stone-900 mb-2">
        Page not found
      </h1>
      <p className="text-stone-500 mb-8 max-w-sm">
        This page doesn&apos;t exist. Head back to the modules to keep learning.
      </p>
      <Link
        href="/learn"
        className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
      >
        Back to modules
      </Link>
    </div>
  );
}
