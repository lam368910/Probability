import type { Market, Portfolio, ProbabilityDataAdapter, ProtocolStats } from '../types/market'

const markets: Market[] = [
  {
    id: 'eth-5k', category: 'Crypto', question: 'Will ETH trade above $5,000 before 2027?', probability: 64,
    change24h: 3.4, volume24h: 1840000, liquidity: 4280000, feeApr: 18.7, feeBps: 30, protocolFeeShareBps: 2000, risk: 'Moderate', closesAt: '31 Dec 2026',
    sparkline: [42, 45, 44, 48, 51, 49, 53, 56, 55, 59, 61, 64], featured: true,
  },
  {
    id: 'fed-rate', category: 'Macro', question: 'Will the Fed cut rates at the September meeting?', probability: 72,
    change24h: -1.8, volume24h: 970000, liquidity: 2350000, feeApr: 13.2, feeBps: 30, protocolFeeShareBps: 2000, risk: 'Low', closesAt: '17 Sep 2026',
    sparkline: [67, 69, 71, 73, 74, 72, 75, 76, 74, 73, 74, 72],
  },
  {
    id: 'ai-model', category: 'Technology', question: 'Will an open-source model lead the benchmark by Q4?', probability: 38,
    change24h: 5.1, volume24h: 615000, liquidity: 1140000, feeApr: 24.1, feeBps: 30, protocolFeeShareBps: 2000, risk: 'Elevated', closesAt: '1 Oct 2026',
    sparkline: [22, 24, 23, 27, 29, 28, 31, 30, 33, 35, 34, 38],
  },
  {
    id: 'btc-dominance', category: 'Crypto', question: 'Will BTC dominance remain above 55% at year end?', probability: 57,
    change24h: 0.7, volume24h: 428000, liquidity: 890000, feeApr: 15.6, feeBps: 30, protocolFeeShareBps: 2000, risk: 'Moderate', closesAt: '31 Dec 2026',
    sparkline: [53, 54, 52, 55, 56, 56, 54, 55, 57, 56, 58, 57],
  },
]

const wait = <T,>(value: T): Promise<T> => Promise.resolve(structuredClone(value))

export const mockAdapter: ProbabilityDataAdapter = {
  getMarkets: () => wait(markets),
  getPortfolio: () => wait({ balance: 12840.62, supplied: 8400, feesEarned: 386.42, pnl30d: 4.8, positions: 3 }),
  getProtocolStats: () => wait({ tvl: 18420000, volume30d: 51200000, fees30d: 153600, activeMarkets: 24 }),
}

type ApiMarket = Omit<Partial<Market>, 'category'> & {
  category?: Market['category'] | string
  title?: string
  yes_probability?: number
  price_yes?: number
  fee_apr?: number
  fee_bps?: number
  protocol_fee_share_bps?: number
  volume_24h?: number
  volume_24h_usd?: number
  liquidity_usd?: number
  closes_at?: string
}

const categories: Record<string, Market['category']> = {
  macro: 'Macro',
  crypto: 'Crypto',
  politics: 'Politics',
  technology: 'Technology',
  climate: 'Climate',
}

function formatApiDate(value: string | undefined, fallback: string): string {
  if (!value) return fallback
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function normalizeMarket(item: ApiMarket, index: number): Market {
  const fallback = markets[index % markets.length]
  const rawProbability = item.probability ?? item.yes_probability ?? item.price_yes ?? fallback.probability
  const probability = rawProbability <= 1 ? Math.round(rawProbability * 100) : Math.round(rawProbability)
  const categoryKey = String(item.category ?? fallback.category).toLowerCase()
  return {
    id: String(item.id ?? fallback.id),
    question: item.question ?? item.title ?? fallback.question,
    category: categories[categoryKey] ?? 'Macro',
    probability,
    change24h: item.change24h ?? 0,
    volume24h: item.volume24h ?? item.volume_24h_usd ?? item.volume_24h ?? 0,
    liquidity: item.liquidity ?? item.liquidity_usd ?? 0,
    feeApr: item.feeApr ?? item.fee_apr ?? null,
    feeBps: item.feeBps ?? item.fee_bps ?? fallback.feeBps,
    protocolFeeShareBps: item.protocolFeeShareBps ?? item.protocol_fee_share_bps ?? null,
    risk: item.risk ?? 'Elevated',
    closesAt: item.closesAt ?? formatApiDate(item.closes_at, fallback.closesAt),
    sparkline: item.sparkline ?? Array.from({ length: 12 }, (_, point) => Math.max(1, Math.min(99, probability + Math.round(Math.sin(point * 0.9) * 3)))),
    featured: item.featured ?? index === 0,
  }
}

const apiBase = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const apiAdapter: ProbabilityDataAdapter = {
  async getMarkets() {
    if (!apiBase) return mockAdapter.getMarkets()
    try {
      const response = await fetch(`${apiBase}/v1/markets`, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`Markets API returned ${response.status}`)
      const payload = await response.json() as ApiMarket[] | { markets: ApiMarket[] }
      const items = Array.isArray(payload) ? payload : payload.markets
      return items.length > 0 ? items.map(normalizeMarket) : mockAdapter.getMarkets()
    } catch {
      return mockAdapter.getMarkets()
    }
  },
  getPortfolio: () => mockAdapter.getPortfolio(),
  getProtocolStats: () => mockAdapter.getProtocolStats(),
}

// Set VITE_API_URL to connect live market reads. Missing or unavailable APIs fall back to safe demo data.
export const dataAdapter: ProbabilityDataAdapter = apiBase ? apiAdapter : mockAdapter
