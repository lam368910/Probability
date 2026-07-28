import type { Market } from '../types/market'
import { formatCompactUsd } from '../lib/format'
import { Icon } from './Icon'
import { Sparkline } from './Sparkline'

export function MarketCard({ market, selected, onSelect }: { market: Market; selected: boolean; onSelect: (market: Market) => void }) {
  const positive = market.change24h >= 0
  return (
    <article className={`market-card ${selected ? 'selected' : ''}`}>
      <button type="button" className="market-card-button" onClick={() => onSelect(market)} aria-pressed={selected}>
        <div className="market-meta"><span>{market.category}</span><span><Icon name="clock" /> {market.closesAt}</span></div>
        <h3>{market.question}</h3>
        <div className="probability-row">
          <div><small>YES PRICE</small><strong>{market.probability}<sup>¢</sup></strong><span className={positive ? 'up' : 'down'}>{positive ? '+' : ''}{market.change24h}%</span></div>
          <Sparkline key={`${market.id}-${market.sparkline.at(-1)}`} values={market.sparkline} positive={positive} />
        </div>
        <div className="market-pair"><span><i style={{ width: `${market.probability}%` }} /></span><small>{market.probability}% yes · {100 - market.probability}% no</small></div>
        <div className="market-metrics">
          <div><span>24H VOLUME</span><strong>{formatCompactUsd(market.volume24h)}</strong></div>
          <div><span>LIQUIDITY</span><strong>{formatCompactUsd(market.liquidity)}</strong></div>
          <div className="apr-cell"><span>FEE APR <b>EST.</b></span><strong>{market.feeApr === null ? 'N/A' : `${market.feeApr}%`}</strong></div>
        </div>
      </button>
      <div className="risk-strip">
        <span className={`risk risk-${market.risk.toLowerCase()}`}>{market.risk} LP risk</span>
        <button type="button" onClick={() => { onSelect(market); document.querySelector('#simulator')?.scrollIntoView({ behavior: 'smooth' }) }}>Simulate <Icon name="arrow" /></button>
      </div>
    </article>
  )
}
