import { useEffect, useMemo, useState } from 'react'
import type { Market } from '../types/market'
import { projectLiveMarkets } from '../lib/liveMarkets'

const STREAM_INTERVAL_MS = 3_800

export function useLiveMarkets(markets: Market[]): Market[] {
  const [tick, setTick] = useState(0)
  const hasDemoMarkets = markets.some((market) => market.source !== 'polymarket')

  useEffect(() => {
    if (!hasDemoMarkets) return undefined

    const advance = () => setTick((value) => value + 1)
    let timer = window.setInterval(advance, STREAM_INTERVAL_MS)

    const handleVisibility = () => {
      window.clearInterval(timer)
      if (!document.hidden) timer = window.setInterval(advance, STREAM_INTERVAL_MS)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [hasDemoMarkets])

  return useMemo(() => projectLiveMarkets(markets, tick), [markets, tick])

}
