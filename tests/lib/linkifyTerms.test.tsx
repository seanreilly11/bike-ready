import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import glossary from '@/data/glossary.json'
import {
  LINKABLE_TERMS,
  TERM_LINKS,
  glossaryAnchor,
} from '@/lib/glossaryLinks'
import { linkifyTerms } from '@/lib/linkifyTerms'

const glossaryTerms = new Set(
  glossary.categories.flatMap((c) => c.terms.map((t) => t.term)),
)

const renderText = (text: string, seen = new Set<string>()) =>
  render(<p>{linkifyTerms(text, seen)}</p>)

// ─── registry integrity ──────────────────────────────────────────────────────

describe('glossaryLinks registry', () => {
  it('every linkable term exists verbatim in glossary.json', () => {
    const missing = LINKABLE_TERMS.filter((t) => !glossaryTerms.has(t))
    expect(missing).toEqual([])
  })

  it('builds a glossary anchor href for each term', () => {
    for (const { term, href } of TERM_LINKS) {
      expect(href).toBe(`/guide/glossary#${glossaryAnchor(term)}`)
    }
  })

  it('is sorted longest-first so phrases win over substrings', () => {
    const lengths = TERM_LINKS.map((t) => t.term.length)
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a))
  })
})

// ─── linkifyTerms ────────────────────────────────────────────────────────────

describe('linkifyTerms', () => {
  it('links a known term to its glossary anchor', () => {
    const { container } = renderText('You must use the fietspad here.')
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/guide/glossary#fietspad')
    expect(link?.textContent).toBe('fietspad')
  })

  it('links only the first occurrence of a term per page', () => {
    const { container } = renderText('A fietspad is a fietspad, always.')
    expect(container.querySelectorAll('a')).toHaveLength(1)
  })

  it('preserves original casing in the link text', () => {
    const { container } = renderText('Haaientanden mean yield.')
    expect(container.querySelector('a')?.textContent).toBe('Haaientanden')
  })

  it('matches multi-word phrases', () => {
    const { container } = renderText('You must voorrang verlenen to the right.')
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe('/guide/glossary#voorrang-verlenen')
    expect(link?.textContent).toBe('voorrang verlenen')
  })

  it('only matches whole words, not substrings of larger words', () => {
    // "stalling" is a term, but "stallingen" must not be linked.
    const { container } = renderText('The fietsenstallingen and stallingen are full.')
    expect(container.querySelectorAll('a')).toHaveLength(0)
  })

  it('shares the seen set across calls so a term links once per page', () => {
    const seen = new Set<string>()
    const first = renderText('The fietspad is wide.', seen)
    const second = renderText('Another fietspad ahead.', seen)
    expect(first.container.querySelectorAll('a')).toHaveLength(1)
    expect(second.container.querySelectorAll('a')).toHaveLength(0)
  })

  it('leaves text without known terms untouched', () => {
    const { container } = renderText('Ride on the right and stay alert.')
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.textContent).toBe('Ride on the right and stay alert.')
  })
})
