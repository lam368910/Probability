import { describe, expect, it } from 'vitest'
import {
  classifyPolymarketCategory,
  normalizePolymarketCandidate,
  selectPolymarketCandidates,
  type GammaEvent,
  type GammaMarket,
} from './polymarketAdapter'

function market(overrides: Partial<GammaMarket> = {}): GammaMarket {
  return {
    id: 'market-1',
    question: 'Will Bitcoin trade above $150,000 this year?',
    endDate: '2026-12-31T00:00:00Z',
    outcomes: '["Yes","No"]',
    outcomePrices: '["0.64","0.36"]',
    clobTokenIds: '["yes-token","no-token"]',
    volume24hr: 250_000,
    liquidityNum: 600_000,
    oneDayPriceChange: 0.018,
    active: true,
    closed: false,
    acceptingOrders: true,
    enableOrderBook: true,
    updatedAt: '2026-07-28T12:00:00Z',
    ...overrides,
  }
}

function event(overrides: Partial<GammaEvent> = {}): GammaEvent {
  return {
    id: 'event-1',
    title: 'Bitcoin price in 2026',
    slug: 'bitcoin-price-in-2026',
    tags: [{ label: 'Crypto', slug: 'crypto' }],
    markets: [market()],
    ...overrides,
  }
}

describe('Polymarket public data adapter', () => {
  it('classifies markets from titles and tags', () => {
    expect(classifyPolymarketCategory(event(), market())).toBe('Crypto')
    expect(classifyPolymarketCategory(event({ title: 'NBA Finals', tags: [{ label: 'Sports' }] }), market({ question: 'Will Boston win?' }))).toBe('Sports')
    expect(classifyPolymarketCategory(event({ title: 'Federal Reserve decision', tags: [] }), market({ question: 'Will the Fed cut rates?' }))).toBe('Macro')
  })

  it('selects the most liquid eligible binary market for each event', () => {
    const events = [
      event({
        markets: [
          market({ id: 'small', volume24hr: 20_000 }),
          market({ id: 'large', volume24hr: 400_000 }),
        ],
      }),
      event({
        id: 'event-2',
        slug: 'fed-rates',
        title: 'Fed rates',
        tags: [{ label: 'Macro' }],
        markets: [market({ id: 'fed', question: 'Will the Fed cut rates?', volume24hr: 300_000 })],
      }),
    ]

    const selected = selectPolymarketCandidates(events)
    expect(selected.map((candidate) => candidate.market.id)).toEqual(['large', 'fed'])
  })

  it('normalizes real prices and seven-day history without inventing fee yield', () => {
    const [candidate] = selectPolymarketCandidates([event()])
    const normalized = normalizePolymarketCandidate(candidate, [
      { t: 1, p: 0.58 },
      { t: 2, p: 0.61 },
      { t: 3, p: 0.64 },
    ])

    expect(normalized).toMatchObject({
      id: 'poly-market-1',
      probability: 64,
      change24h: 1.8,
      feeApr: null,
      source: 'polymarket',
      sourceUrl: 'https://polymarket.com/event/bitcoin-price-in-2026',
      sparkline: [58, 61, 64],
      priceWindow: '7D',
    })
  })

  it('rejects malformed, illiquid, or history-free entries', () => {
    expect(selectPolymarketCandidates([event({ markets: [market({ outcomes: 'not-json' })] })])).toEqual([])
    expect(selectPolymarketCandidates([event({ markets: [market({ liquidityNum: 500 })] })])).toEqual([])
    const [candidate] = selectPolymarketCandidates([event()])
    expect(normalizePolymarketCandidate(candidate, [{ t: 1, p: 0.6 }])).toBeNull()
  })
})
