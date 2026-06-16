import type { ReactNode } from 'react'

interface PageBannerProps {
  title:     string
  subtitle?: string
  right?:    ReactNode   // optional right-side element (status pill, count, etc.)
}

// Shared orange page header band (Practice / Review / Guide): orange-light fill
// with a left orange accent stripe, a title + optional subtitle, and an optional
// right-aligned slot.
export default function PageBanner({ title, subtitle, right }: PageBannerProps) {
  return (
    <div className="bg-orange-light border border-stone-200 border-l-4 border-l-orange rounded-2xl px-5 py-4 sm:px-6 mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <h1 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight lg:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-stone-600 mt-1">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}
