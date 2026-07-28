import { useEffect, useMemo, useState } from 'react'
import type { Market } from '../types/market'

const actions = ['BUY YES', 'ADD LP', 'SELL NO', 'BUY NO'] as const
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

export function MarketActivity({ markets }: { markets: Market[] }) {
  const [tick, setTick] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1_000)
    const stream = window.setInterval(() => setTick((value) => value + 1), 2_900)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(stream)
    }
  }, [])

  const events = useMemo(() => Array.from({ length: 3 }, (_, index) => {
    const sequence = tick + index
    const market = markets[sequence % markets.length]
    const action = actions[(sequence * 3 + index) % actions.length]
    const amount = 180 + ((sequence + 3) * (index + 7) * 137) % 8_400
    const direction = action === 'BUY YES' ? '+' : action === 'BUY NO' || action === 'SELL NO' ? '−' : '+'
    const movement = ((sequence * 7 + index * 3) % 9 + 1) / 10
    return { market, action, amount, direction, movement }
  }), [markets, tick])

  return (
    <section className="activity-rail" aria-label="Simulated market activity" data-reveal>
      <div className="activity-status">
        <span className="activity-radar" aria-hidden="true"><i /><i /></span>
        <div><small>SIMULATED STREAM</small><strong>MARKET PULSE</strong></div>
      </div>
      <div className="activity-events">
        {events.map((event, index) => (
          <article className="activity-event" key={`${tick}-${event.market.id}-${index}`}>
            <div><span>{event.action}</span><small>{event.market.id.toUpperCase()}</small></div>
            <strong>{event.amount.toLocaleString('en-US')} <i>USDC</i></strong>
            <em className={event.direction === '+' ? 'up' : 'down'}>{event.direction}{event.movement.toFixed(1)}¢</em>
          </article>
        ))}
      </div>
      <div className="activity-clock"><small>UTC / STREAM</small><strong>{timeFormatter.format(now)}</strong></div>
    </section>
  )
}
