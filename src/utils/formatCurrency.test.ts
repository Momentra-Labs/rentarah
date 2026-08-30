import { describe, expect, it } from 'vitest'

import { formatPeso } from './formatCurrency'

describe('formatPeso', () => {
  it('formats whole PHP amounts without fraction digits', () => {
    const out = formatPeso(2500)
    expect(out).toMatch(/2,?500/)
    expect(out).toMatch(/₱|PHP/)
  })

  it('rounds fractional amounts', () => {
    const out = formatPeso(99.7)
    expect(out).toMatch(/100/)
  })
})
