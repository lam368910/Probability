import type { Market } from '../types/market'
import { formatCompactUsd } from '../lib/format'

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

function probability(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}

export function MarketActivity({ markets }: { markets: Market[] }) {
  const snapshots = markets.slice(0, 3)
  const live = snapshots.some((market) => market.source === 'polymarket')
  const updatedAt = snapshots.find((market) => market.updatedAt)?.updatedAt
  const updated = updatedAt && !Number.isNaN(new Date(updatedAt).getTime())
    ? `${timeFormatter.format(new Date(updatedAt))} UTC`
    : 'this session'

  return (
    <section className={`activity-rail ${live ? 'is-live' : ''}`} aria-label={live ? 'Live market snapshots' : 'Demo market snapshots'} data-reveal>
      <header className="activity-status">
        <span className="activity-kicker"><i /> {live ? 'REAL PUBLIC DATA' : 'DEMO FALLBACK'}</span>
        <h2>Market snapshots</h2>
        <p>Current YES price, 24-hour movement and trading volume for the most active markets.</p>
        <small>UPDATED {updated}</small>
      </header>
      <div className="activity-events">
        {snapshots.map((market) => {
          const positive = market.change24h >= 0
          return (
            <article className="activity-event" key={market.id}>
              <div className="activity-event-head"><span>{market.category}</span><em className={positive ? 'up' : 'down'}>{positive ? '+' : ''}{market.change24h.toFixed(1)}pp <small>24H</small></em></div>
              <h3>{market.question}</h3>
              <div className="activity-event-metrics">
                <div><small>YES PRICE</small><strong>{probability(market.probability)}<sup>¢</sup></strong></div>
                <div><small>24H VOLUME</small><strong>{formatCompactUsd(market.volume24h)}</strong></div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
