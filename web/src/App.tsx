import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { Markets } from './components/Markets'
import { Simulator } from './components/Simulator'
import { PortfolioView } from './components/PortfolioView'
import { Mechanics, Safety } from './components/Mechanics'
import { dataAdapter } from './data/mockAdapter'
import type { Market, Portfolio, ProtocolStats } from './types/market'
import { Icon } from './components/Icon'

interface AppData { markets: Market[]; portfolio: Portfolio; stats: ProtocolStats }

export default function App() {
  const [data, setData] = useState<AppData | null>(null)
  const [selected, setSelected] = useState<Market | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([dataAdapter.getMarkets(), dataAdapter.getPortfolio(), dataAdapter.getProtocolStats()]).then(([markets, portfolio, stats]) => {
      if (active) { setData({ markets, portfolio, stats }); setSelected(markets[0]) }
    })
    return () => { active = false }
  }, [])

  if (!data || !selected) return <main className="loading-screen"><div className="brand-mark"><i /><i /><i /><i /></div><span>Calibrating markets</span></main>

  return (
    <>
      <Header />
      <main>
        <Hero stats={data.stats} />
        <div className="ticker" aria-label="Protocol highlights"><div><span>◈</span> FEE-FUNDED YIELD <i /> <span>◈</span> MARKET-NEUTRAL INTENT <i /> <span>◈</span> TRANSPARENT RISK <i /> <span>◈</span> CAPITAL EFFICIENCY <i /> <span>◈</span> FEE-FUNDED YIELD <i /></div></div>
        <Markets markets={data.markets} selected={selected} onSelect={setSelected} />
        <Simulator market={selected} />
        <PortfolioView portfolio={data.portfolio} markets={data.markets} />
        <Mechanics />
        <Safety />
      </main>
      <footer><a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /><i /></span><span>Probability</span></a><p>Infrastructure for markets about the future.</p><div><a href="#markets">Markets</a><a href="#safety">Risk disclosure</a><a href="https://github.com/lam368910/Probability" target="_blank" rel="noreferrer">GitHub <Icon name="arrow" /></a></div><small>© 2026 Probability Labs · Testnet demonstration</small></footer>
    </>
  )
}
