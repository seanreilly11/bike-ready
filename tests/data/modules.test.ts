import { describe, expect, it } from 'vitest'
import modules from '@/data/modules'

describe('modules data', () => {
  it('defines exactly 7 modules', () => {
    expect(modules).toHaveLength(7)
  })

  it('fundamentals is alwaysFree', () => {
    const fundamentals = modules.find((m) => m.id === 'fundamentals')
    expect(fundamentals?.alwaysFree).toBe(true)
  })

  it('no other module is alwaysFree', () => {
    const freeModules = modules.filter((m) => m.alwaysFree)
    expect(freeModules).toHaveLength(1)
    expect(freeModules[0].id).toBe('fundamentals')
  })

  it('every module has a non-empty title', () => {
    for (const mod of modules) {
      expect(mod.title, `${mod.id} missing title`).toBeTruthy()
    }
  })

  it('every module has a badgeId', () => {
    for (const mod of modules) {
      expect(mod.badgeId, `${mod.id} missing badgeId`).toBeTruthy()
    }
  })

  it('every module has a non-empty description', () => {
    for (const mod of modules) {
      expect(mod.description, `${mod.id} missing description`).toBeTruthy()
    }
  })

  it('every module has an icon', () => {
    for (const mod of modules) {
      expect(mod.icon, `${mod.id} missing icon`).toBeTruthy()
    }
  })

  it('all module ids are unique', () => {
    const ids = modules.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('module order starts with fundamentals', () => {
    expect(modules[0].id).toBe('fundamentals')
  })
})
