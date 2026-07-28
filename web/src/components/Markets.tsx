import { useDeferredValue, useMemo, useState } from 'react'
import type { Market, MarketCategory } from '../types/market'
import { Icon } from './Icon'
import { MarketCard } from './MarketCard'

const filters: Array<'All' | MarketCategory> = ['All', 'Crypto', 'Macro', 'Technology', 'Climate', 'Politics', 'Sports']

export function Markets({ markets, selected, onSelect }: { markets: Market[]; selected: Market; onSelect: (market: Market) => void }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const deferredFilter = useDeferredValue(filter)
  const visible = useMemo(() => deferredFilter === 'All' ? markets : markets.filter((market) => market.category === deferredFilter), [deferredFilter, markets])
  const availableFilters = useMemo(() => filters.filter((item) => item === 'All' || markets.some((market) => market.category === item)), [markets])
  const external = markets.some((market) => market.source === 'polymarket')

  return (
    <section className="markets-section" id="markets">
      <div className="section-heading">
        <div><span className="section-index">01</span><p className="eyebrow-text">{external ? 'REAL MARKET DISCOVERY' : 'DEMO MARKET FALLBACK'}</p><h2>Markets with a pulse.</h2></div>
        <p>{external ? 'Live public prices, liquidity and seven-day history. External data is read-only and is not the resolution oracle for the Probability Arc market.' : 'The external feed is unavailable, so the interface is showing clearly marked demonstration data.'}</p>
      </div>
      <div className={`market-feed-note ${external ? 'is-live' : ''}`} role="status">
        <span><i /> {external ? 'POLYMARKET PUBLIC API CONNECTED' : 'SAFE DEMO FALLBACK ACTIVE'}</span>
        <small>{external ? 'Gamma discovery · CLOB price history · refreshed per session' : 'No external data is being presented as live'}</small>
      </div>
      <div className="filter-row" role="group" aria-label="Filter markets by category">
        {availableFilters.map((item) => <button type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)} key={item}>{item}</button>)}
        {external ? <a className="view-all" href="https://polymarket.com/markets" target="_blank" rel="noreferrer">Browse source <Icon name="arrow" /></a> : <button type="button" className="view-all" onClick={() => setFilter('All')}>View all markets <Icon name="arrow" /></button>}
      </div>
      {visible.length > 0 ? <div className="market-grid">{visible.map((market) => <MarketCard key={market.id} market={market} selected={selected.id === market.id} onSelect={onSelect} />)}</div> : <div className="empty-state">No active markets in this category.</div>}
    </section>
  )
}
