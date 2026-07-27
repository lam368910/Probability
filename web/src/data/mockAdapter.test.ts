import { describe, expect, it } from 'vitest'
import { normalizeMarket } from './mockAdapter'

describe('API market normalization', () => {
  it('maps backend field names and category casing', () => {
    const market = normalizeMarket({
      id: 'climate-1',
      question: 'Will the cited temperature record be broken?',
      category: 'climate',
      yes_probability: 0.34,
      liquidity_usd: 96_400,
      volume_24h_usd: 18_760,
      fee_bps: 125,
      closes_at: '2026-12-31T00:00:00Z',
    }, 0)

    expect(market.category).toBe('Climate')
    expect(market.probability).toBe(34)
    expect(market.liquidity).toBe(96_400)
    expect(market.volume24h).toBe(18_760)
    expect(market.feeApr).toBeNull()
    expect(market.feeBps).toBe(125)
    expect(market.protocolFeeShareBps).toBeNull()
    expect(market.risk).toBe('Elevated')
  })
})
