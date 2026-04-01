import Button from '@/components/ui/Button'

interface UpsellBannerProps {
  moduleName: string
  moduleQuestionCount: number
  onUnlock: () => void
}

export default function UpsellBanner({ moduleName, moduleQuestionCount, onUnlock }: UpsellBannerProps) {
  return (
    <div className="bg-white border-2 border-orange rounded-2xl px-6 py-8 text-center">
      <div className="text-3xl mb-3">🚲</div>
      <h2 className="font-display font-extrabold text-2xl text-stone-900 tracking-tight mb-2">
        Unlock the full course
      </h2>
      <p className="text-stone-500 text-sm mb-1">
        {moduleQuestionCount} questions in {moduleName} alone.
      </p>
      <p className="text-stone-500 text-sm mb-6">
        All 6 modules, Review queue, and the BikeReady Test.
      </p>
      <Button variant="primary" size="lg" full onClick={onUnlock}>
        Unlock for €4.99
      </Button>
      <p className="text-stone-400 text-xs mt-2">
        One-time payment. No subscription.
      </p>
    </div>
  )
}
