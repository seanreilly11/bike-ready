'use client'

import { useState } from 'react'
import type { Difficulty, Question } from '@/types'
import lessonsData from '@/data/lessons.json'
import { useAnalytics } from '@/hooks/useAnalytics'

interface LessonAccordionProps {
  skill:      string
  difficulty: Difficulty
  question:   Question
}

export default function LessonAccordion({ skill, difficulty, question }: LessonAccordionProps) {
  const [open, setOpen] = useState(false)
  const { track } = useAnalytics()

  // Reset to closed when the question changes
  const resetKey = `${skill}-${difficulty}`
  const [prevResetKey, setPrevResetKey] = useState(resetKey)
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey)
    setOpen(false)
  }

  const lesson = (lessonsData.lessons as Record<string, Record<Difficulty, { title: string; body: string }>>)[skill]?.[difficulty]
  if (!lesson) return null

  return (
    <div className="mb-3">
      <button
        onClick={() => {
          track('lesson_accordion_toggled', {
            question_id: question.id,
            skill: question.skill,
            difficulty: question.difficulty,
            open: !open,
          })
          setOpen(o => !o)
        }}
        className={[
          'w-full flex items-center justify-between gap-2 cursor-pointer',
          'rounded-xl border border-orange px-4 py-3',
          'text-left text-sm font-display font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2',
          open ? 'bg-orange-light' : 'bg-white',
          'text-orange',
        ].join(' ')}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wide text-stone-400">Lesson</span>
          <span>{lesson.title}</span>
        </span>
        <span className="shrink-0 text-stone-400" aria-hidden>
          {open ? '▲' : '▼'}
        </span>
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-200 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="mt-1.5 bg-orange-light border border-orange-mid rounded-xl px-4 py-3">
            <p className="text-base text-stone-700 leading-relaxed">{lesson.body}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
