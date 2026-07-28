import type { Market } from '../types/market'

export function projectLiveMarkets(markets: Market[], tick: number): Market[] {
  return markets.map((market, index) => {
    if (market.source === 'polymarket') return market
    const wave = Math.sin((tick + index * 1.7) * 0.82)
    const probability = Math.max(2, Math.min(98, market.probability + Math.round(wave * 1.4)))
    const activity = 1 + Math.max(-0.006, wave * 0.004)

    return {
      ...market,
      probability,
      volume24h: Math.round(market.volume24h * activity),
      sparkline: [...market.sparkline.slice(1), probability],
    }
  })
}
