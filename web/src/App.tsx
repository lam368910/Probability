import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Markets } from './components/Markets'
import { Simulator } from './components/Simulator'
import { PortfolioView } from './components/PortfolioView'
import { Mechanics, Safety } from './components/Mechanics'
import { dataAdapter, demoPortfolioMarkets } from './data/mockAdapter'
import type { Market, Portfolio } from './types/market'
import { Icon } from './components/Icon'
import { ArcMvpPanel } from './components/ArcMvpPanel'
import { useArcWallet } from './hooks/useArcWallet'
import { MarketActivity } from './components/MarketActivity'
import { useLiveMarkets } from './hooks/useLiveMarkets'
import { useAmbientMotion } from './hooks/useAmbientMotion'

interface AppData { markets: Market[]; portfolio: Portfolio }
const EMPTY_MARKETS: Market[] = []

export default function App() {
  const arcWallet = useArcWallet()
  const [data, setData] = useState<AppData | null>(null)
  const [selectedId, setSelectedId] = useState('')
  const liveMarkets = useLiveMarkets(data?.markets ?? EMPTY_MARKETS)
  const selected = liveMarkets.find((market) => market.id === selectedId) ?? liveMarkets[0] ?? null
  useAmbientMotion(Boolean(data))

  useEffect(() => {
    let active = true
    Promise.all([dataAdapter.getMarkets(), dataAdapter.getPortfolio()]).then(([markets, portfolio]) => {
      if (active) { setData({ markets, portfolio }); setSelectedId(markets[0]?.id ?? '') }
    })
    return () => { active = false }
  }, [])

  if (!data || !selected) return <main className="loading-screen"><div className="brand-mark"><i /><i /><i /><i /></div><span>Calibrating markets</span></main>

  return (
    <>
      <Header />
      <main>
        <Hero market={selected} />
        <ArcMvpPanel wallet={arcWallet} />
        <MarketActivity markets={liveMarkets} />
        <div className="ticker" aria-label="Protocol highlights"><div><span>◈</span> FEE-FUNDED YIELD <i /> <span>◈</span> MARKET-NEUTRAL INTENT <i /> <span>◈</span> TRANSPARENT RISK <i /> <span>◈</span> CAPITAL EFFICIENCY <i /> <span>◈</span> FEE-FUNDED YIELD <i /></div></div>
        <Markets markets={liveMarkets} selected={selected} onSelect={(market) => setSelectedId(market.id)} />
        <Simulator market={selected} wallet={arcWallet} />
        <PortfolioView portfolio={data.portfolio} markets={demoPortfolioMarkets} />
        <Mechanics />
        <Safety />
      </main>
      <footer><a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /><i /></span><span>Probability</span></a><p>Infrastructure for markets about the future.</p><div><a href="#markets">Markets</a><a href="#safety">Risk disclosure</a><a href="https://github.com/lam368910/Probability" target="_blank" rel="noreferrer">GitHub <Icon name="arrow" /></a></div><small>© 2026 Probability Labs · Testnet demonstration</small></footer>
    </>
  )
}
