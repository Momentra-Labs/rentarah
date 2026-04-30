import { getFirebaseAuth, isFirebaseConfigured } from './firebase'

/** Remote URL or inlined image from profile upload flow. */
export function isProfilePhotoAvatar(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image/')
}

/** Fallback letters when no image is shown (signup / demo store two-char labels in `avatar`). */
export function getDefaultAvatarInitials(firstName: string, lastName: string): string {
  const fn = firstName.trim()
  const ln = lastName.trim()
  const parts = fn.split(/\s+/)
  const a = (parts[0]?.[0] ?? '?').toUpperCase()
  const b = (ln[0] ?? parts[1]?.[0] ?? parts[0]?.[1] ?? '?').toUpperCase()
  return `${a}${b}`.slice(0, 2)
}

export function initialsFromStoredAvatarField(avatar: string | undefined | null, firstName: string, lastName: string): string {
  if (avatar && !isProfilePhotoAvatar(avatar)) {
    const cleaned = avatar.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    if (cleaned.length >= 2) return cleaned.slice(0, 2)
    if (cleaned.length === 1) return `${cleaned}${getDefaultAvatarInitials(firstName, lastName).charAt(1)}`.slice(0, 2)
    const trimmed = avatar.trim().toUpperCase()
    if (trimmed.length >= 2) return trimmed.slice(0, 2)
  }
  return getDefaultAvatarInitials(firstName, lastName)
}

/**
 * Clearing a portrait from profile:
 * - Dropping a **custom upload** (data URL) → OAuth profile photo if linked, otherwise initials.
 * - Dropping a **remote** photo (e.g. Google URL) → initials.
 */
export function resolveAvatarAfterRemovePhoto(
  profile: Pick<{ avatar: string; firstName: string; lastName: string }, 'avatar' | 'firstName' | 'lastName'>,
): string {
  const customUpload = typeof profile.avatar === 'string' && profile.avatar.startsWith('data:image/')
  if (customUpload) {
    if (isFirebaseConfigured()) {
      try {
        const u = getFirebaseAuth().currentUser
        if (u?.photoURL) return u.photoURL
      } catch {
        /* ignore */
      }
    }
    return getDefaultAvatarInitials(profile.firstName, profile.lastName)
  }
  return getDefaultAvatarInitials(profile.firstName, profile.lastName)
}
