export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export type PasswordRuleFlags = {
  minLength: boolean
  mixedCase: boolean
  number: boolean
  symbol: boolean
}

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel
  score: number
  /** 0–4 segments filled for UI bars */
  segments: number
  label: string
  rules: PasswordRuleFlags
}

export const PASSWORD_RULES: { key: keyof PasswordRuleFlags; label: string }[] = [
  { key: 'minLength', label: '8+ characters' },
  { key: 'mixedCase', label: 'Upper and lower case' },
  { key: 'number', label: 'A number' },
  { key: 'symbol', label: 'A symbol' },
]

export function getPasswordRules(password: string): PasswordRuleFlags {
  return {
    minLength: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  }
}

/**
 * Heuristic strength meter (not a guarantee of security). Drives progress color + label.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  const rules = getPasswordRules(password)
  if (!password) {
    return { level: 'empty', score: 0, segments: 0, label: '', rules }
  }

  let score = 0
  if (rules.minLength) score += 1
  if (password.length >= 12) score += 1
  if (rules.mixedCase) score += 1
  if (rules.number) score += 1
  if (rules.symbol) score += 1

  const capped = Math.min(score, 4)
  let level: PasswordStrengthLevel
  let label: string
  if (capped <= 1) {
    level = 'weak'
    label = 'Weak — add length and mix of letters & numbers'
  } else if (capped === 2) {
    level = 'fair'
    label = 'Fair — you’re getting there'
  } else if (capped === 3) {
    level = 'good'
    label = 'Good — solid password'
  } else {
    level = 'strong'
    label = 'Strong — nice work'
  }

  return { level, score: capped, segments: capped, label, rules }
}
