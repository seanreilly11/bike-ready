'use client'

import type { Question, LocalProgress, ModuleStatus, Difficulty } from '@/types'
import lessonsData from '@/data/lessons.json'
import Badge from '@/components/ui/Badge'
import SignDisplay from '@/components/ui/SignDisplay'
import DotMap from '@/components/modules/DotMap'

interface StudyRailProps {
  question:        Question
  moduleQuestions: Question[]
  progress:        LocalProgress
  currentId:       string
  onDotClick:      (index: number) => void
  alwaysFree?:     boolean
  moduleStatus?:   ModuleStatus
}

// The desktop context rail: what the current question is teaching (skill +
// lesson), where you are in the module, and the sign in play.
export default function StudyRail({
  question,
  moduleQuestions,
  progress,
  currentId,
  onDotClick,
  alwaysFree,
  moduleStatus,
}: StudyRailProps) {
  const lesson = (
    lessonsData.lessons as Record<
      string,
      Record<Difficulty, { title: string; body: string }>
    >
  )[question.skill]?.[question.difficulty]

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-1.5">
        What you&apos;re learning
      </p>
      <p className="font-display font-extrabold text-lg text-stone-900 leading-tight">
        {question.skill}
      </p>
      <div className="mt-2">
        <Badge variant={question.difficulty} label={question.difficulty} />
      </div>

      {lesson && (
        <div className="mt-4">
          <p className="font-display font-bold text-sm text-orange mb-1">
            {lesson.title}
          </p>
          <p className="text-sm text-stone-600 leading-relaxed">{lesson.body}</p>
        </div>
      )}

      <div className="border-t border-stone-200 my-4" />

      <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-2">
        Module progress
      </p>
      <DotMap
        questions={moduleQuestions}
        progress={progress}
        currentId={currentId}
        onDotClick={onDotClick}
        alwaysFree={alwaysFree}
        moduleStatus={moduleStatus}
      />

      {question.sign && (
        <>
          <div className="border-t border-stone-200 my-4" />
          <p className="font-mono text-xs uppercase tracking-wide text-stone-400 mb-2">
            Sign in this question
          </p>
          <SignDisplay signId={question.sign} />
        </>
      )}
    </div>
  )
}
