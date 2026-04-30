/**
 * Philippine mobile + driver's license normalization / validation shared across onboarding, profile, booking.
 */

export const MOBILE_E164_REGEX = /^\+639\d{9}$/

/** LTO hyphenated driver's license numbers — hyphenated clusters on plastics (last block length varies). */
const DL_HYPHENATED = /^[A-Z]\d{2}-\d{2}-\d{6,8}$/

/** Fallback: leading letter typical of DL card numbers (N12345678, MOCK000, etc.). */
const DL_ALPHANUM = /^[A-Z][A-Z0-9-]{6,}$/

/** True if already canonical +639 + 9 mobile digits (ignores whitespace). */
export function isStoredPhilippineMobileE164(stored: string | null | undefined): boolean {
  if (!stored) return false
  return MOBILE_E164_REGEX.test(stored.replace(/[\s().-]/g, ''))
}

/**
 * Parses user input (+63 917…, 0917…, 917…) and returns E.164 +639XXXXXXXXX, or null.
 * Core rule: exactly ten digits beginning with **9** (Globe/Smart/etc. prefixes like 917, 915, 916…).
 */
export function normalizePhilippineMobileForStorage(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (MOBILE_E164_REGEX.test(trimmed.replace(/[\s().-]/g, ''))) {
    const d = trimmed.replace(/\D/g, '')
    return `+63${d.replace(/^63/, '')}`
  }

  let digits = trimmed.replace(/^\+/, '').replace(/[\s().-]/g, '')
  if (!/^\d+$/.test(digits)) return null

  if (digits.startsWith('63') && digits.length >= 11) digits = digits.slice(2)

  // Domestic trunk: 09XXXXXXXX (11 digits) → strip leading 0
  if (digits.startsWith('0') && digits.length === 11 && digits[1] === '9') {
    digits = digits.slice(1)
  }

  // Plain mobile without country or trunk (9151234567, 9171234567)
  if (digits.length === 10 && digits[0] === '9' && /^9\d{9}$/.test(digits)) {
    return `+63${digits}`
  }

  return null
}

/** Strips pasted / typed values to up to 10 national digits for the "+63" split field. */
export function parsePhilippineMobileInputToNationalDigits(raw: string): string {
  let d = raw.replace(/\D/g, '')
  if (d.startsWith('63') && d.length >= 11) d = d.slice(2)
  if (d.startsWith('0') && d.length >= 11 && d[1] === '9') d = d.slice(1)
  return d.slice(0, 10)
}

/** For split +63 / national UI: load stored E.164 into the 10-digit field. */
export function e164ToNationalMobileDigits(storedOrEmpty: string): string {
  if (!storedOrEmpty?.trim()) return ''
  const n = normalizePhilippineMobileForStorage(storedOrEmpty)
  if (n) return n.slice(3)
  return parsePhilippineMobileInputToNationalDigits(storedOrEmpty)
}

export function nationalMobileDigitsToE164(nationalTen: string): string | null {
  const d = parsePhilippineMobileInputToNationalDigits(nationalTen)
  if (d.length !== 10 || d[0] !== '9' || !/^9\d{9}$/.test(d)) return null
  return `+63${d}`
}

/** Readable spacing: "+63 917 123 4567". */
export function formatPhilippineMobileDisplay(e164OrInput: string): string | null {
  const canon = isStoredPhilippineMobileE164(e164OrInput)
    ? `+63${e164OrInput.replace(/\D/g, '').replace(/^63/, '')}`
    : normalizePhilippineMobileForStorage(e164OrInput)

  if (!canon || !MOBILE_E164_REGEX.test(canon)) return null

  const d = canon.slice(3)
  return `+63 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

export function normalizePhilippineDriversLicense(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

const LTO_HYPHENATE_MIN_DIGITS_AFTER_LETTER = 10

/**
 * Live LTO-style masking: `L + two pairs + up to 8 digits` → `L##-##-#######` when the suffix is all digits
 * and long enough to be the common card layout. Shorter all-digit suffix stays compact (still valid as N12345678).
 */
export function formatPhilippineDriversLicenseInput(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const u = trimmed.toUpperCase().replace(/[^A-Z0-9-]/g, '')
  const collapsedHyphens = u.replace(/-{2,}/g, '-')
  const alnumOnly = collapsedHyphens.replace(/-/g, '')
  if (alnumOnly.length === 0) return ''

  const letter = alnumOnly[0]
  if (!/[A-Z]/.test(letter)) return normalizePhilippineDriversLicense(trimmed)

  const afterLetter = alnumOnly.slice(1)
  if (afterLetter.length === 0) return letter

  if (/^\d+$/.test(afterLetter)) {
    const digits = afterLetter.slice(0, 12)
    if (digits.length >= LTO_HYPHENATE_MIN_DIGITS_AFTER_LETTER) {
      return `${letter}${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
    }
    return `${letter}${digits}`
  }

  return normalizePhilippineDriversLicense(trimmed)
}

export function isValidPhilippineDriversLicense(normalizedUpper: string): boolean {
  if (normalizedUpper.length < 7) return false
  return DL_HYPHENATED.test(normalizedUpper) || DL_ALPHANUM.test(normalizedUpper)
}

/** Used by persisted profile completeness check (accepts legacy messy stored values once normalizable). */
export function profilePhoneMeetsPhilippineMobileBar(storedPhone: string | null | undefined): boolean {
  if (!storedPhone?.trim()) return false
  if (isStoredPhilippineMobileE164(storedPhone)) return true
  return normalizePhilippineMobileForStorage(storedPhone) !== null
}
