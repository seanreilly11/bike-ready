import type { SignId } from '@/types'
import { SIGN_REGISTRY } from '@/data/signs'

interface SignDisplayProps {
  signId: SignId
}

export default function SignDisplay({ signId }: SignDisplayProps) {
  const SignComponent = SIGN_REGISTRY[signId]
  if (!SignComponent) return null

  return (
    <div className="flex justify-center items-center bg-stone-100 rounded-xl p-4 mb-4">
      <SignComponent />
    </div>
  )
}
