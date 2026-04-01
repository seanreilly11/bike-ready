'use client'

import { useState, useEffect } from 'react'
import type { Difficulty } from '@/types'
import lessonsData from '@/data/lessons.json'

interface LessonAccordionProps {
  skill:      string
  difficulty: Difficulty
}

export default function LessonAccordion({ skill, difficulty }: LessonAccordionProps) {
  const [open, setOpen] = useState(false)

  // Reset to closed on each new question
  useEffect(() => {
    setOpen(false)
  }, [skill, difficulty])

  const lesson = (lessonsData.lessons as Record<string, Record<Difficulty, { title: string; body: string }>>)[skill]?.[difficulty]
  if (!lesson) return null

  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className={[
          'w-full flex items-center justify-between gap-2 cursor-pointer',
          'rounded-xl border border-orange px-4 py-2.5',
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

      {open && (
        <div className="mt-1.5 bg-orange-light border border-orange-mid rounded-xl px-4 py-3 animate-fade-up">
          <p className="text-sm text-stone-700 leading-relaxed">{lesson.body}</p>
        </div>
      )}
    </div>
  )
}
