import { describe, expect, it } from 'vitest'
import { calculateLiquidityQuote, calculateTradeQuote } from './format'

describe('quote calculations', () => {
  it('returns a positive fee estimate for meaningful liquidity', () => {
    expect(calculateLiquidityQuote(5000, 18, 30).grossFees).toBeGreaterThan(70)
  })

  it('includes the 30 bps demo trading fee', () => {
    expect(calculateTradeQuote(1000, 60).fee).toBe(3)
    expect(calculateTradeQuote(1000, 60, 125).fee).toBe(12.5)
  })
})
