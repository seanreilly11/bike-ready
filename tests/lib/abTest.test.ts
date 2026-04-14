import { describe, it, expect } from 'vitest'
import { assignVariant, getStoredVariant } from '@/lib/abTest'

// localStorage is reset after each test by tests/setup.ts

const VARIANTS = ['control', 'variant_a', 'variant_b'] as const
const TWO = ['control', 'treatment'] as const

// ─── assignVariant ───────────────────────────────────────────────────────────

describe('assignVariant', () => {
  it('always returns a value that is in the provided variants list', () => {
    localStorage.setItem('bikeready_anon_id', crypto.randomUUID())
    expect(VARIANTS).toContain(assignVariant('test', VARIANTS))
  })

  it('is deterministic: same anon_id + testName always hashes to the same variant', () => {
    const anonId = 'deterministic-user-abc'
    localStorage.setItem('bikeready_anon_id', anonId)

    // Assign once, then clear storage and re-derive
    const first = assignVariant('hero_copy', VARIANTS)
    localStorage.removeItem('bikeready_ab_hero_copy')
    const second = assignVariant('hero_copy', VARIANTS)

    expect(first).toBe(second)
  })

  it('returns stored assignment on repeated calls without recomputing', () => {
    localStorage.setItem('bikeready_anon_id', crypto.randomUUID())
    const first  = assignVariant('hero_copy', VARIANTS)
    const second = assignVariant('hero_copy', VARIANTS)

    expect(second).toBe(first)
    expect(localStorage.getItem('bikeready_ab_hero_copy')).toBe(first)
  })

  it('persists assignment to localStorage under bikeready_ab_<testName>', () => {
    localStorage.setItem('bikeready_anon_id', crypto.randomUUID())
    const variant = assignVariant('my_test', VARIANTS)
    expect(localStorage.getItem('bikeready_ab_my_test')).toBe(variant)
  })

  it('distributes across variants: 100 distinct users do not all get the same variant', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      localStorage.removeItem('bikeready_ab_spread_test')
      localStorage.setItem('bikeready_anon_id', `spread-user-${i}`)
      seen.add(assignVariant('spread_test', VARIANTS))
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('covers every variant: each option is assigned to at least one user across 300 seeds', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) {
      localStorage.removeItem('bikeready_ab_coverage')
      localStorage.setItem('bikeready_anon_id', `coverage-${i}`)
      seen.add(assignVariant('coverage', VARIANTS))
    }
    for (const v of VARIANTS) {
      expect(seen).toContain(v)
    }
  })

  it('distributes roughly evenly across a binary test (within ±20% of 50%)', () => {
    let controlCount = 0
    const N = 500
    for (let i = 0; i < N; i++) {
      localStorage.removeItem('bikeready_ab_balance')
      localStorage.setItem('bikeready_anon_id', `balance-user-${i}`)
      if (assignVariant('balance', TWO) === 'control') controlCount++
    }
    const pct = controlCount / N
    expect(pct).toBeGreaterThan(0.3)
    expect(pct).toBeLessThan(0.7)
  })

  it('different test names are assigned independently for the same user', () => {
    localStorage.setItem('bikeready_anon_id', 'independent-user')
    const a = assignVariant('test_alpha', TWO)
    const b = assignVariant('test_beta',  TWO)

    expect(localStorage.getItem('bikeready_ab_test_alpha')).toBe(a)
    expect(localStorage.getItem('bikeready_ab_test_beta')).toBe(b)
    // They may be equal by chance but are stored independently
  })

  it('still returns a valid variant when anon_id is absent (hashes empty seed)', () => {
    // No anon_id stored → seed is '' → still deterministic, not necessarily variants[0]
    // variants[0] is only the fallback on the server (typeof window === 'undefined')
    expect(VARIANTS).toContain(assignVariant('hero_copy', VARIANTS))
  })

  it('ignores a stored value that is not in the current variants list', () => {
    localStorage.setItem('bikeready_anon_id', 'some-user')
    localStorage.setItem('bikeready_ab_hero_copy', 'deleted_variant')
    // Should derive a fresh assignment from anon_id rather than returning the stale value
    expect(VARIANTS).toContain(assignVariant('hero_copy', VARIANTS))
  })

  it('stored assignment survives an anon_id change (user does not get reassigned)', () => {
    localStorage.setItem('bikeready_anon_id', 'original')
    const original = assignVariant('sticky', VARIANTS)

    // Simulate an edge-case where anon_id is overwritten
    localStorage.setItem('bikeready_anon_id', 'different')
    expect(assignVariant('sticky', VARIANTS)).toBe(original)
  })
})

// ─── getStoredVariant ────────────────────────────────────────────────────────

describe('getStoredVariant', () => {
  it('returns null when no assignment exists for the test', () => {
    expect(getStoredVariant('hero_copy')).toBeNull()
  })

  it('returns the assigned variant after assignVariant is called', () => {
    localStorage.setItem('bikeready_anon_id', crypto.randomUUID())
    const assigned = assignVariant('hero_copy', VARIANTS)
    expect(getStoredVariant('hero_copy')).toBe(assigned)
  })

  it('returns null for a different test name even after another test is assigned', () => {
    localStorage.setItem('bikeready_anon_id', crypto.randomUUID())
    assignVariant('hero_copy', VARIANTS)
    expect(getStoredVariant('other_test')).toBeNull()
  })

  it('reflects a manually written localStorage value', () => {
    localStorage.setItem('bikeready_ab_manual', 'variant_a')
    expect(getStoredVariant('manual')).toBe('variant_a')
  })
})
