import { describe, expect, it } from 'vitest'
import type { Market } from '../types/market'
import { projectLiveMarkets } from './liveMarkets'

const market: Market = {
  id: 'test',
  category: 'Crypto',
  question: 'Test market?',
  probability: 98,
  change24h: 1,
  volume24h: 1_000,
  liquidity: 2_000,
  feeApr: 12,
  feeBps: 30,
  protocolFeeShareBps: 2_000,
  risk: 'Moderate',
  closesAt: '31 Dec 2026',
  sparkline: [90, 92, 94, 96, 98],
}

describe('projectLiveMarkets', () => {
  it('keeps probabilities inside presentation-safe bounds', () => {
    for (let tick = 0; tick < 100; tick += 1) {
      const [projected] = projectLiveMarkets([market], tick)
      expect(projected.probability).toBeGreaterThanOrEqual(2)
      expect(projected.probability).toBeLessThanOrEqual(98)
    }
  })

  it('rolls the sparkline without mutating source data', () => {
    const original = structuredClone(market)
    const [projected] = projectLiveMarkets([market], 3)

    expect(market).toEqual(original)
    expect(projected).not.toBe(market)
    expect(projected.sparkline).toEqual([...market.sparkline.slice(1), projected.probability])
  })

  it('does not synthesize movement for externally sourced markets', () => {
    const liveMarket = { ...market, source: 'polymarket' as const }
    expect(projectLiveMarkets([liveMarket], 18)[0]).toBe(liveMarket)
  })
})
