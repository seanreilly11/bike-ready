'use client'

import { useState } from 'react'
import type { Question } from '@/types'
import Badge from '@/components/ui/Badge'
import SignDisplay from '@/components/ui/SignDisplay'
import LessonAccordion from './LessonAccordion'
import OptionButton from './OptionButton'
import FeedbackPanel from './FeedbackPanel'

type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'unselected-after-answer'

interface QuestionCardProps {
  question:    Question
  onAnswer:    (optionId: string, correct: boolean) => void
  answered:    boolean
  selectedId:  string | null
  hideCorrect: boolean   // true in Test mode
}

const typeLabels: Record<string, string> = {
  multiple_choice:   'Multiple choice',
  true_false:        'True / False',
  scenario_decision: 'Scenario',
}

export default function QuestionCard({
  question,
  onAnswer,
  answered,
  selectedId,
  hideCorrect,
}: QuestionCardProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(selectedId)
  const [localAnswered, setLocalAnswered]  = useState(answered)

  function handleSelect(optionId: string) {
    if (localAnswered) return
    const correct = optionId === question.correct
    setLocalSelected(optionId)
    setLocalAnswered(true)
    onAnswer(optionId, correct)
  }

  function getOptionState(optionId: string): OptionState {
    if (!localAnswered) {
      return localSelected === optionId ? 'selected' : 'idle'
    }
    if (hideCorrect) {
      return localSelected === optionId ? 'selected' : 'unselected-after-answer'
    }
    if (optionId === question.correct) return 'correct'
    if (optionId === localSelected)    return 'incorrect'
    return 'unselected-after-answer'
  }

  const isCorrect = localSelected === question.correct

  return (
    <div className="animate-fade-up">
      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
          {question.skill}
        </span>
        <Badge variant={question.difficulty} label={question.difficulty} />
        <span className="font-mono text-xs uppercase tracking-wide text-stone-400">
          {typeLabels[question.type]}
        </span>
      </div>

      {/* Lesson accordion */}
      <LessonAccordion skill={question.skill} difficulty={question.difficulty} />

      {/* Prompt card */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-3">
        {question.sign && <SignDisplay signId={question.sign} />}
        <p className="font-display text-base text-stone-900 leading-relaxed">
          {question.prompt}
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.options.map(option => (
          <OptionButton
            key={option.id}
            option={option}
            state={getOptionState(option.id)}
            onClick={() => handleSelect(option.id)}
            disabled={localAnswered}
          />
        ))}
      </div>

      {/* Feedback */}
      {localAnswered && !hideCorrect && (
        <FeedbackPanel feedback={question.feedback} correct={isCorrect} />
      )}
    </div>
  )
}
