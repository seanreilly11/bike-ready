import type { Feedback } from '@/types'

interface FeedbackPanelProps {
  feedback: Feedback
  correct:  boolean
}

export default function FeedbackPanel({ feedback, correct }: FeedbackPanelProps) {
  return (
    <div
      className={[
        'rounded-xl border p-4 mt-4 animate-fade-up',
        correct
          ? 'bg-green-light border-green-mid'
          : 'bg-red-light border-red-mid',
      ].join(' ')}
    >
      <p className={[
        'font-display font-bold text-base mb-1',
        correct ? 'text-green-dark' : 'text-red-dark',
      ].join(' ')}>
        {feedback.title}
      </p>

      <p className="text-stone-900 text-sm leading-relaxed mb-3">
        {feedback.body}
      </p>

      <div className="border-t border-current/10 pt-3 space-y-2">
        <div>
          <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-0.5">
            Rule
          </span>
          <p className="text-sm text-stone-600 leading-relaxed">{feedback.rule}</p>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-0.5">
            Tip
          </span>
          <p className="text-sm text-stone-600 leading-relaxed">{feedback.tip}</p>
        </div>
      </div>
    </div>
  )
}
