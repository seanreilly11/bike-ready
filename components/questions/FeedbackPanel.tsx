'use client'

import { useEffect } from 'react'
import { Check, X } from 'lucide-react'
import type { Feedback, Question } from '@/types'
import { AnswerResult } from '@/types'
import { useAnalytics } from '@/hooks/useAnalytics'

interface FeedbackPanelProps {
  feedback: Feedback
  correct:  boolean
  question: Question
}

export default function FeedbackPanel({ feedback, correct, question }: FeedbackPanelProps) {
  const { track } = useAnalytics()

  useEffect(() => {
    track('feedback_panel_viewed', {
      question_id: question.id,
      module: question.module,
      correct,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div
      className={[
        'rounded-xl border p-4 mt-4 animate-fade-up',
        correct
          ? 'bg-green-light border-green-mid'
          : 'bg-red-light border-red-mid',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className={[
          'flex-none w-6 h-6 rounded-full flex items-center justify-center',
          correct ? 'bg-green-mid text-green-dark' : 'bg-red-mid text-red-dark',
        ].join(' ')}>
          {correct ? <Check size={15} aria-hidden="true" /> : <X size={15} aria-hidden="true" />}
        </span>
        <p className={[
          'font-display font-bold text-base',
          correct ? 'text-green-dark' : 'text-red-dark',
        ].join(' ')}>
          {correct ? AnswerResult.Correct : AnswerResult.Wrong}
        </p>
      </div>

      <p className="text-stone-900 text-base leading-relaxed mb-3">
        {feedback.body}
      </p>

      <div className="border-t border-current/10 pt-3 space-y-2">
        <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
          <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-0.5">
            Rule
          </span>
          <p className="text-sm text-stone-600 leading-relaxed">{feedback.rule}</p>
        </div>
        <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
          <span className="font-mono text-xs uppercase tracking-wide text-stone-400 block mb-0.5">
            Tip
          </span>
          <p className="text-sm text-stone-600 leading-relaxed">{feedback.tip}</p>
        </div>
      </div>
    </div>
  )
}
