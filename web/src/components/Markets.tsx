import { useDeferredValue, useMemo, useState } from 'react'
import type { Market, MarketCategory } from '../types/market'
import { Icon } from './Icon'
import { MarketCard } from './MarketCard'

const filters: Array<'All' | MarketCategory> = ['All', 'Crypto', 'Macro', 'Technology', 'Climate', 'Politics']

export function Markets({ markets, selected, onSelect }: { markets: Market[]; selected: Market; onSelect: (market: Market) => void }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const deferredFilter = useDeferredValue(filter)
  const visible = useMemo(() => deferredFilter === 'All' ? markets : markets.filter((market) => market.category === deferredFilter), [deferredFilter, markets])

  return (
    <section className="markets-section" id="markets">
      <div className="section-heading">
        <div><span className="section-index">01</span><p className="eyebrow-text">SIMULATED OPPORTUNITIES</p><h2>Markets with depth.</h2></div>
        <p>Demo yield estimates are illustrative and may not represent achievable returns. Choose a market to model a hypothetical position.</p>
      </div>
      <div className="filter-row" role="group" aria-label="Filter markets by category">
        {filters.map((item) => <button type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}
        <button type="button" className="view-all">View all markets <Icon name="arrow" /></button>
      </div>
      {visible.length > 0 ? <div className="market-grid">{visible.map((market) => <MarketCard key={market.id} market={market} selected={selected.id === market.id} onSelect={onSelect} />)}</div> : <div className="empty-state">No demo markets in this category yet.</div>}
    </section>
  )
}
