export type MarketCategory = 'Macro' | 'Crypto' | 'Politics' | 'Technology' | 'Climate' | 'Sports'

export type MarketSource = 'demo' | 'polymarket'

export interface Market {
  id: string
  question: string
  category: MarketCategory
  probability: number
  change24h: number
  volume24h: number
  liquidity: number
  feeApr: number | null
  feeBps: number
  protocolFeeShareBps: number | null
  risk: 'Low' | 'Moderate' | 'Elevated'
  closesAt: string
  sparkline: number[]
  featured?: boolean
  source?: MarketSource
  sourceLabel?: string
  sourceUrl?: string
  updatedAt?: string
  priceWindow?: string
}

export interface Portfolio {
  balance: number
  supplied: number
  feesEarned: number
  pnl30d: number
  positions: number
}

export interface ProtocolStats {
  tvl: number
  volume30d: number
  fees30d: number
  activeMarkets: number
}

export interface ProbabilityDataAdapter {
  getMarkets(): Promise<Market[]>
  getPortfolio(): Promise<Portfolio>
  getProtocolStats(): Promise<ProtocolStats>
}
