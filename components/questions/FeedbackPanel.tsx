'use client'

import { useEffect } from 'react'
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
      <p className={[
        'font-display font-bold text-base mb-1',
        correct ? 'text-green-dark' : 'text-red-dark',
      ].join(' ')}>
        {correct ? AnswerResult.Correct : AnswerResult.Wrong}
      </p>

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
