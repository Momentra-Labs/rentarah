export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel
  score: number
  /** 0–4 segments filled for UI bars */
  segments: number
  label: string
}

/**
 * Heuristic strength meter (not a guarantee of security). Drives progress color + label.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { level: 'empty', score: 0, segments: 0, label: '' }
  }

  let score = 0
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

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

  return { level, score: capped, segments: capped, label }
}
