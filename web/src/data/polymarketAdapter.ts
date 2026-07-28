import type { Market, MarketCategory } from '../types/market'

const GAMMA_EVENTS_URL = 'https://gamma-api.polymarket.com/events?active=true&closed=false&order=volume24hr&ascending=false&limit=40'
const CLOB_HISTORY_URL = 'https://clob.polymarket.com/prices-history'
const CACHE_KEY = 'probability:polymarket-markets:v1'
const CACHE_TTL_MS = 60_000
const MARKET_LIMIT = 6

interface GammaTag {
  label?: string
  slug?: string
}

export interface GammaMarket {
  id?: string
  question?: string
  slug?: string
  endDate?: string
  outcomePrices?: string
  outcomes?: string
  volume24hr?: number
  liquidityNum?: number
  liquidity?: string
  oneDayPriceChange?: number
  clobTokenIds?: string
  active?: boolean
  closed?: boolean
  acceptingOrders?: boolean
  enableOrderBook?: boolean
  updatedAt?: string
}

export interface GammaEvent {
  id?: string
  title?: string
  slug?: string
  tags?: GammaTag[]
  markets?: GammaMarket[]
}

export interface PricePoint {
  t: number
  p: number
}

export interface Candidate {
  event: GammaEvent
  market: GammaMarket
  yesPrice: number
  yesTokenId: string
  volume24h: number
  liquidity: number
  category: MarketCategory
}

interface MarketCache {
  expiresAt: number
  markets: Market[]
  version: 1
}

let requestInFlight: Promise<Market[]> | null = null

function parseStringArray(value: string | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function finiteNumber(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? number : 0
}

export function classifyPolymarketCategory(event: GammaEvent, market: GammaMarket): MarketCategory {
  const haystack = [
    event.title,
    market.question,
    ...(event.tags ?? []).flatMap((tag) => [tag.label, tag.slug]),
  ].filter(Boolean).join(' ').toLowerCase()

  if (/bitcoin|ethereum|crypto|blockchain|solana|xrp|doge/.test(haystack)) return 'Crypto'
  if (/sport|mlb|nba|nfl|nhl|soccer|tennis|esport|league of legends|ufc|f1|formula 1/.test(haystack)) return 'Sports'
  if (/artificial intelligence|\bai\b|technology|tech|openai|apple|nvidia|tesla/.test(haystack)) return 'Technology'
  if (/climate|weather|temperature|hurricane|environment/.test(haystack)) return 'Climate'
  if (/fed|rates|econom|inflation|gdp|cpi|market cap|recession/.test(haystack)) return 'Macro'
  return 'Politics'
}

function toCandidate(event: GammaEvent, market: GammaMarket): Candidate | null {
  const outcomes = parseStringArray(market.outcomes).map((outcome) => outcome.toLowerCase())
  const prices = parseStringArray(market.outcomePrices).map(Number)
  const tokens = parseStringArray(market.clobTokenIds)
  const yesIndex = outcomes.indexOf('yes')
  const yesPrice = finiteNumber(prices[yesIndex])
  const yesTokenId = tokens[yesIndex]
  const volume24h = finiteNumber(market.volume24hr)
  const liquidity = finiteNumber(market.liquidityNum ?? market.liquidity)

  if (
    !market.id || !market.question || !event.slug || !yesTokenId
    || market.active === false || market.closed === true
    || market.acceptingOrders === false || market.enableOrderBook === false
    || outcomes.length !== 2 || yesIndex < 0
    || yesPrice < .03 || yesPrice > .97
    || volume24h < 1_000 || liquidity < 10_000
  ) return null

  return {
    event,
    market,
    yesPrice,
    yesTokenId,
    volume24h,
    liquidity,
    category: classifyPolymarketCategory(event, market),
  }
}

export function selectPolymarketCandidates(events: GammaEvent[], limit = MARKET_LIMIT): Candidate[] {
  const bestPerEvent: Candidate[] = []

  for (const event of events) {
    let best: Candidate | null = null
    for (const market of event.markets ?? []) {
      const candidate = toCandidate(event, market)
      if (candidate && (!best || candidate.volume24h > best.volume24h)) best = candidate
    }
    if (best) bestPerEvent.push(best)
  }

  bestPerEvent.sort((left, right) => right.volume24h - left.volume24h)
  const selected: Candidate[] = []
  const categoryCounts = new Map<MarketCategory, number>()

  for (const candidate of bestPerEvent) {
    if ((categoryCounts.get(candidate.category) ?? 0) >= 2) continue
    selected.push(candidate)
    categoryCounts.set(candidate.category, (categoryCounts.get(candidate.category) ?? 0) + 1)
    if (selected.length === limit) return selected
  }

  for (const candidate of bestPerEvent) {
    if (selected.includes(candidate)) continue
    selected.push(candidate)
    if (selected.length === limit) break
  }
  return selected
}

function formatEndDate(value: string | undefined): string {
  if (!value) return 'Date pending'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date pending'
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function downsampleHistory(history: PricePoint[], limit = 30): number[] {
  const usable = history.filter((point) => Number.isFinite(point.p) && point.p >= 0 && point.p <= 1)
  if (usable.length <= limit) return usable.map((point) => Math.round(point.p * 1_000) / 10)
  const result: number[] = []
  const step = (usable.length - 1) / (limit - 1)
  for (let index = 0; index < limit; index += 1) {
    result.push(Math.round(usable[Math.round(index * step)].p * 1_000) / 10)
  }
  return result
}

export function normalizePolymarketCandidate(candidate: Candidate, history: PricePoint[]): Market | null {
  const sparkline = downsampleHistory(history)
  if (sparkline.length < 2) return null
  const probability = Math.round(candidate.yesPrice * 1_000) / 10
  const change24h = Math.round(finiteNumber(candidate.market.oneDayPriceChange) * 1_000) / 10

  return {
    id: `poly-${candidate.market.id}`,
    question: candidate.market.question ?? candidate.event.title ?? 'Untitled market',
    category: candidate.category,
    probability,
    change24h,
    volume24h: candidate.volume24h,
    liquidity: candidate.liquidity,
    feeApr: null,
    feeBps: 30,
    protocolFeeShareBps: null,
    risk: candidate.liquidity >= 500_000 ? 'Low' : candidate.liquidity >= 100_000 ? 'Moderate' : 'Elevated',
    closesAt: formatEndDate(candidate.market.endDate),
    sparkline,
    source: 'polymarket',
    sourceLabel: 'Polymarket',
    sourceUrl: `https://polymarket.com/event/${encodeURIComponent(candidate.event.slug ?? '')}`,
    updatedAt: candidate.market.updatedAt ?? new Date().toISOString(),
    priceWindow: '7D',
  }
}

async function fetchHistory(tokenId: string): Promise<PricePoint[]> {
  const query = new URLSearchParams({ market: tokenId, interval: '1w', fidelity: '120' })
  const response = await fetch(`${CLOB_HISTORY_URL}?${query}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) throw new Error(`Polymarket history returned ${response.status}`)
  const payload = await response.json() as { history?: PricePoint[] }
  return Array.isArray(payload.history) ? payload.history : []
}

function readCache(): Market[] | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null') as MarketCache | null
    return cached?.version === 1 && cached.expiresAt > Date.now() && Array.isArray(cached.markets)
      ? cached.markets
      : null
  } catch {
    return null
  }
}

function writeCache(markets: Market[]): void {
  if (typeof sessionStorage === 'undefined') return
  try {
    const cache: MarketCache = { version: 1, expiresAt: Date.now() + CACHE_TTL_MS, markets }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Storage can be disabled; live fetching remains available without it.
  }
}

async function loadPolymarketMarkets(): Promise<Market[]> {
  const cached = readCache()
  if (cached) return cached

  const response = await fetch(GAMMA_EVENTS_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8_000),
  })
  if (!response.ok) throw new Error(`Polymarket events returned ${response.status}`)
  const events = await response.json() as GammaEvent[]
  const candidates = selectPolymarketCandidates(events)
  if (candidates.length < 4) throw new Error('Not enough eligible live markets')

  const histories = await Promise.all(candidates.map(async (candidate) => {
    try {
      return await fetchHistory(candidate.yesTokenId)
    } catch {
      return []
    }
  }))
  const markets = candidates.flatMap((candidate, index) => {
    const market = normalizePolymarketCandidate(candidate, histories[index])
    return market ? [market] : []
  })
  if (markets.length < 4) throw new Error('Not enough live markets with price history')
  writeCache(markets)
  return markets
}

export function fetchPolymarketMarkets(): Promise<Market[]> {
  requestInFlight ??= loadPolymarketMarkets().finally(() => { requestInFlight = null })
  return requestInFlight
}
