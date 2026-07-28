import type { Market } from '../types/market'
import { formatCompactUsd } from '../lib/format'
import { Icon } from './Icon'
import { Sparkline } from './Sparkline'

const utcTime = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
})

function formatProbability(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}

export function MarketCard({ market, selected, onSelect }: { market: Market; selected: boolean; onSelect: (market: Market) => void }) {
  const positive = market.change24h >= 0
  const external = market.source === 'polymarket'
  const probability = formatProbability(market.probability)
  const noProbability = formatProbability(100 - market.probability)
  const updated = market.updatedAt && !Number.isNaN(new Date(market.updatedAt).getTime())
    ? `${utcTime.format(new Date(market.updatedAt))} UTC`
    : 'recently'
  return (
    <article className={`market-card ${external ? 'market-card-live' : ''} ${selected ? 'selected' : ''}`}>
      <button type="button" className="market-card-button" onClick={() => onSelect(market)} aria-pressed={selected}>
        <div className="market-meta"><span>{market.category}</span><span><Icon name="clock" /> {market.closesAt}</span></div>
        {external ? <div className="market-source"><span><i /> LIVE PUBLIC DATA</span><small>{market.sourceLabel} · updated {updated}</small></div> : null}
        <h3>{market.question}</h3>
        <div className="probability-row">
          <div><small>YES PRICE</small><strong>{probability}<sup>¢</sup></strong><span className={positive ? 'up' : 'down'}>{positive ? '+' : ''}{market.change24h.toFixed(1)}pp</span></div>
          <div className="market-chart"><span>{market.priceWindow ?? 'RECENT'} PRICE</span><Sparkline key={`${market.id}-${market.sparkline.at(-1)}`} values={market.sparkline} positive={positive} /></div>
        </div>
        <div className="market-pair"><span><i style={{ width: `${market.probability}%` }} /></span><small>{probability}% yes · {noProbability}% no</small></div>
        <div className="market-metrics">
          <div><span>24H VOLUME</span><strong>{formatCompactUsd(market.volume24h)}</strong></div>
          <div><span>LIQUIDITY</span><strong>{formatCompactUsd(market.liquidity)}</strong></div>
          <div className="apr-cell"><span>{external ? 'PRICE SERIES' : 'FEE APR'} <b>{external ? 'REAL' : 'EST.'}</b></span><strong>{external ? market.priceWindow : market.feeApr === null ? 'N/A' : `${market.feeApr}%`}</strong></div>
        </div>
      </button>
      <div className="risk-strip">
        <span className={`risk risk-${market.risk.toLowerCase()}`}>{market.risk} {external ? 'depth risk' : 'LP risk'}</span>
        <div className="market-actions">
          {market.sourceUrl ? <a href={market.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a> : null}
          <button type="button" onClick={() => { onSelect(market); document.querySelector('#simulator')?.scrollIntoView({ behavior: 'smooth' }) }}>Model in Probability <Icon name="arrow" /></button>
        </div>
      </div>
    </article>
  )
}
