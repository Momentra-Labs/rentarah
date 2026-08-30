import { describe, expect, it } from 'vitest'

import { isLocalAuthAllowed } from './authService'

describe('isLocalAuthAllowed', () => {
  it('returns a boolean based on env / DEV default', () => {
    expect(typeof isLocalAuthAllowed()).toBe('boolean')
  })
})
