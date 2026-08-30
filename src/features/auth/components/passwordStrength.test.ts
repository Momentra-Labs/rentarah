import { describe, expect, it } from 'vitest'

import { getPasswordRules, getPasswordStrength, PASSWORD_RULES } from './passwordStrength'

describe('getPasswordRules', () => {
  it('starts with all rules unmet', () => {
    expect(getPasswordRules('')).toEqual({
      minLength: false,
      mixedCase: false,
      number: false,
      symbol: false,
    })
  })

  it('ticks each rule independently', () => {
    expect(getPasswordRules('abcdefgh').minLength).toBe(true)
    expect(getPasswordRules('Ab').mixedCase).toBe(true)
    expect(getPasswordRules('1').number).toBe(true)
    expect(getPasswordRules('!').symbol).toBe(true)
  })

  it('marks a complete password as meeting every published rule', () => {
    const rules = getPasswordRules('Abcd123!')
    expect(PASSWORD_RULES.every((rule) => rules[rule.key])).toBe(true)
    expect(getPasswordStrength('Abcd123!').rules).toEqual(rules)
  })
})
