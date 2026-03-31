interface ProgressBarProps {
  value:  number        // 0–100
  color?: 'orange' | 'green'
  height?: number       // px, default 4
}

const colorClasses = {
  orange: 'bg-orange',
  green:  'bg-green',
}

export default function ProgressBar({ value, color = 'orange', height = 4 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div
      className="w-full rounded-full overflow-hidden bg-stone-200"
      style={{ height }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={[
          'h-full rounded-full',
          'transition-[width] duration-500 ease-out',
          colorClasses[color],
        ].join(' ')}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
