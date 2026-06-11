import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DotMap from '@/components/modules/DotMap'
import { useAppStore } from '@/stores/appStore'
import type { ModuleId, Question, LocalProgress } from '@/types'
import { FREE_PER_MODULE } from '@/types'

function resetStore() {
  useAppStore.setState({ progress: {}, earned: [], user: null, isPremium: false })
}

function makeQuestions(count: number, moduleId: ModuleId = 'priority'): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i + 1}`,
    module: moduleId,
    skill: 'Test',
    difficulty: 'easy' as const,
    type: 'multiple_choice' as const,
    prompt: `Question ${i + 1}`,
    options: [{ id: 'a', label: 'True' }, { id: 'b', label: 'False' }],
    correct: 'a',
    feedback: { body: 'Body', rule: 'Rule', tip: 'Tip' },
    status: 'active' as const,
  }))
}

describe('DotMap', () => {
  beforeEach(resetStore)

  it('renders one button per question', () => {
    const questions = makeQuestions(5)
    render(
      <DotMap questions={questions} progress={{}} currentId="" onDotClick={vi.fn()} alwaysFree={false} />
    )
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('marks the current question as active via aria-label', () => {
    const questions = makeQuestions(3)
    render(
      <DotMap questions={questions} progress={{}} currentId="q2" onDotClick={vi.fn()} alwaysFree={false} />
    )
    expect(screen.getByRole('button', { name: /Question 2: active/i })).toBeInTheDocument()
  })

  it('marks an unseen question as unseen via aria-label', () => {
    const questions = makeQuestions(3)
    render(
      <DotMap questions={questions} progress={{}} currentId="q1" onDotClick={vi.fn()} alwaysFree={false} />
    )
    expect(screen.getByRole('button', { name: /Question 2: unseen/i })).toBeInTheDocument()
  })

  it('marks a correctly answered question as correct', () => {
    const questions = makeQuestions(3)
    const progress: LocalProgress = { q1: { seen: true, correct: true } }
    render(
      <DotMap questions={questions} progress={progress} currentId="q2" onDotClick={vi.fn()} alwaysFree={false} />
    )
    expect(screen.getByRole('button', { name: /Question 1: correct/i })).toBeInTheDocument()
  })

  it('marks a wrongly answered question as seen', () => {
    const questions = makeQuestions(3)
    const progress: LocalProgress = { q1: { seen: true, correct: false } }
    render(
      <DotMap questions={questions} progress={progress} currentId="q2" onDotClick={vi.fn()} alwaysFree={false} />
    )
    expect(screen.getByRole('button', { name: /Question 1: seen/i })).toBeInTheDocument()
  })

  it(`locks questions at index >= FREE_PER_MODULE (${FREE_PER_MODULE}) for non-premium users`, () => {
    const questions = makeQuestions(FREE_PER_MODULE + 2)
    useAppStore.setState({ isPremium: false })
    render(
      <DotMap questions={questions} progress={{}} currentId="q1" onDotClick={vi.fn()} alwaysFree={false} />
    )
    // Question FREE_PER_MODULE+1 (index FREE_PER_MODULE) should be locked
    expect(
      screen.getByRole('button', { name: new RegExp(`Question ${FREE_PER_MODULE + 1}: locked`, 'i') })
    ).toBeDisabled()
  })

  it('does not lock questions for premium users', () => {
    const questions = makeQuestions(FREE_PER_MODULE + 2)
    useAppStore.setState({ isPremium: true })
    render(
      <DotMap questions={questions} progress={{}} currentId="q1" onDotClick={vi.fn()} alwaysFree={false} />
    )
    expect(
      screen.queryByRole('button', { name: /locked/i })
    ).not.toBeInTheDocument()
  })

  it('does not lock questions when alwaysFree=true even for non-premium', () => {
    const questions = makeQuestions(FREE_PER_MODULE + 2)
    useAppStore.setState({ isPremium: false })
    render(
      <DotMap questions={questions} progress={{}} currentId="q1" onDotClick={vi.fn()} alwaysFree={true} />
    )
    expect(screen.queryByRole('button', { name: /locked/i })).not.toBeInTheDocument()
  })

  it('calls onDotClick with the question index when a non-locked dot is clicked', async () => {
    const user = userEvent.setup()
    const questions = makeQuestions(3)
    const onDotClick = vi.fn()
    render(
      <DotMap questions={questions} progress={{}} currentId="q1" onDotClick={onDotClick} alwaysFree={true} />
    )
    await user.click(screen.getByRole('button', { name: /Question 2/i }))
    expect(onDotClick).toHaveBeenCalledWith(1)
  })

  it('does not call onDotClick when a locked dot is clicked', async () => {
    const user = userEvent.setup()
    const questions = makeQuestions(FREE_PER_MODULE + 1)
    useAppStore.setState({ isPremium: false })
    const onDotClick = vi.fn()
    render(
      <DotMap questions={questions} progress={{}} currentId="q1" onDotClick={onDotClick} alwaysFree={false} />
    )
    // The last button is locked
    const lockedBtn = screen.getByRole('button', { name: new RegExp(`Question ${FREE_PER_MODULE + 1}: locked`, 'i') })
    await user.click(lockedBtn)
    expect(onDotClick).not.toHaveBeenCalled()
  })
})
