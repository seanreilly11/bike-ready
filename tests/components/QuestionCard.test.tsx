import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuestionCard from '@/components/questions/QuestionCard'
import type { Question } from '@/types'

const question: Question = {
  id: 'test_001',
  module: 'priority',
  skill: 'Right Before Left',
  difficulty: 'easy',
  type: 'multiple_choice',
  prompt: 'Who has priority at an unmarked intersection?',
  options: [
    { id: 'a', label: 'The car coming from the left' },
    { id: 'b', label: 'The car coming from the right' },
    { id: 'c', label: 'Whoever arrived first' },
  ],
  correct: 'b',
  feedback: {
    body: 'Right-before-left is the default Dutch rule.',
    rule: 'RVV 1990 article 15.',
    tip: 'When in doubt, wait for traffic from your right.',
  },
  status: 'active',
}

function renderCard(onAnswer = vi.fn(), overrides: Partial<{ answered: boolean; selectedId: string | null; hideCorrect: boolean }> = {}) {
  return render(
    <QuestionCard
      question={question}
      onAnswer={onAnswer}
      answered={overrides.answered ?? false}
      selectedId={overrides.selectedId ?? null}
      hideCorrect={overrides.hideCorrect ?? false}
    />
  )
}

describe('QuestionCard', () => {
  it('renders the question prompt', () => {
    renderCard()
    expect(screen.getByText(question.prompt)).toBeInTheDocument()
  })

  it('renders all options', () => {
    renderCard()
    for (const option of question.options) {
      expect(screen.getByText(option.label)).toBeInTheDocument()
    }
  })

  it('calls onAnswer with correct optionId and correct=true when correct option is clicked', () => {
    const onAnswer = vi.fn()
    renderCard(onAnswer)
    fireEvent.click(screen.getByText('The car coming from the right'))
    expect(onAnswer).toHaveBeenCalledOnce()
    expect(onAnswer).toHaveBeenCalledWith('b', true)
  })

  it('calls onAnswer with optionId and correct=false when wrong option is clicked', () => {
    const onAnswer = vi.fn()
    renderCard(onAnswer)
    fireEvent.click(screen.getByText('The car coming from the left'))
    expect(onAnswer).toHaveBeenCalledOnce()
    expect(onAnswer).toHaveBeenCalledWith('a', false)
  })

  it('does not call onAnswer again after the first answer (answered state locks)', () => {
    const onAnswer = vi.fn()
    renderCard(onAnswer)
    fireEvent.click(screen.getByText('The car coming from the right'))
    fireEvent.click(screen.getByText('The car coming from the left'))
    fireEvent.click(screen.getByText('Whoever arrived first'))
    expect(onAnswer).toHaveBeenCalledOnce()
  })

  it('shows FeedbackPanel after clicking an option', () => {
    renderCard()
    expect(screen.queryByText(question.feedback.body)).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('The car coming from the right'))
    expect(screen.getByText(question.feedback.body)).toBeInTheDocument()
  })

  it('does not show FeedbackPanel before answering', () => {
    renderCard()
    expect(screen.queryByText(question.feedback.body)).not.toBeInTheDocument()
  })

  it('does not show FeedbackPanel when hideCorrect=true even after answering', () => {
    const onAnswer = vi.fn()
    render(
      <QuestionCard
        question={question}
        onAnswer={onAnswer}
        answered={false}
        selectedId={null}
        hideCorrect={true}
      />
    )
    fireEvent.click(screen.getByText('The car coming from the right'))
    expect(screen.queryByText(question.feedback.body)).not.toBeInTheDocument()
  })
})
