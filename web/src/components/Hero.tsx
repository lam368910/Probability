import { useId, useMemo } from 'react'
import type { Market } from '../types/market'
import { formatCompactUsd } from '../lib/format'
import { Icon } from './Icon'

const chartWidth = 640
const chartHeight = 214
const chartPadding = { top: 18, right: 14, bottom: 26, left: 42 }

const utcTime = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
})

function formatProbability(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)
}

function MarketHistoryChart({ market }: { market: Market }) {
  const rawGradientId = useId()
  const gradientId = `hero-market-${rawGradientId.replaceAll(':', '')}`
  const chart = useMemo(() => {
    const values = market.sparkline.length >= 2 ? market.sparkline : [market.probability, market.probability]
    let observedMin = values[0]
    let observedMax = values[0]
    for (let index = 1; index < values.length; index += 1) {
      observedMin = Math.min(observedMin, values[index])
      observedMax = Math.max(observedMax, values[index])
    }
    const minimum = Math.max(0, Math.floor(observedMin - 2))
    const maximum = Math.min(100, Math.ceil(observedMax + 2))
    const span = maximum - minimum || 1
    const plotWidth = chartWidth - chartPadding.left - chartPadding.right
    const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
    const coordinates = values.map((value, index) => {
      const x = chartPadding.left + (index / (values.length - 1)) * plotWidth
      const y = chartPadding.top + ((maximum - value) / span) * plotHeight
      return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }
    })
    const points = coordinates.map(({ x, y }) => `${x},${y}`).join(' ')
    const linePath = `M${points.replaceAll(' ', ' L')}`
    const last = coordinates.at(-1) ?? { x: chartPadding.left, y: chartPadding.top }
    const areaPath = `${linePath} L${last.x},${chartHeight - chartPadding.bottom} L${chartPadding.left},${chartHeight - chartPadding.bottom} Z`
    return { minimum, maximum, linePath, areaPath, last }
  }, [market.probability, market.sparkline])

  const ticks = [chart.maximum, (chart.maximum + chart.minimum) / 2, chart.minimum]

  return (
    <div className="terminal-chart-wrap">
      <div className="terminal-chart-label"><span>YES PRICE · 7 DAY HISTORY</span><span>{market.source === 'polymarket' ? 'REAL CLOB SERIES' : 'DEMO SERIES'}</span></div>
      <svg className="terminal-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`Seven-day YES price history for ${market.question}`}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d7ff3f" stopOpacity=".24" />
            <stop offset="100%" stopColor="#d7ff3f" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((row) => {
          const y = chartPadding.top + row * ((chartHeight - chartPadding.top - chartPadding.bottom) / 2)
          return <line key={row} className="terminal-grid-line" x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} />
        })}
        {[0, 1, 2, 3, 4, 5, 6].map((column) => {
          const x = chartPadding.left + column * ((chartWidth - chartPadding.left - chartPadding.right) / 6)
          return <line key={column} className="terminal-grid-line vertical" x1={x} y1={chartPadding.top} x2={x} y2={chartHeight - chartPadding.bottom} />
        })}
        {ticks.map((tick, index) => <text key={index} className="terminal-axis-label" x="0" y={chartPadding.top + index * ((chartHeight - chartPadding.top - chartPadding.bottom) / 2) + 3}>{formatProbability(tick)}¢</text>)}
        <path className="terminal-area" d={chart.areaPath} fill={`url(#${gradientId})`} />
        <path className="terminal-line" d={chart.linePath} pathLength="1" />
        <circle className="terminal-end-halo" cx={chart.last.x} cy={chart.last.y} r="8" />
        <circle className="terminal-end-dot" cx={chart.last.x} cy={chart.last.y} r="3.5" />
        <text className="terminal-time-label" x={chartPadding.left} y={chartHeight - 5}>−7D</text>
        <text className="terminal-time-label" x={chartWidth - chartPadding.right} y={chartHeight - 5} textAnchor="end">NOW</text>
      </svg>
    </div>
  )
}

export function Hero({ market }: { market: Market }) {
  const positive = market.change24h >= 0
  const sourceLive = market.source === 'polymarket'
  const updated = market.updatedAt && !Number.isNaN(new Date(market.updatedAt).getTime())
    ? `${utcTime.format(new Date(market.updatedAt))} UTC`
    : 'this session'
  let sevenDayLow = market.probability
  let sevenDayHigh = market.probability
  for (const value of market.sparkline) {
    sevenDayLow = Math.min(sevenDayLow, value)
    sevenDayHigh = Math.max(sevenDayHigh, value)
  }

  return (
    <section className="hero" id="top" data-reveal>
      <div className="hero-copy reveal">
        <div className="eyebrow"><span>Market-making infrastructure</span><i /></div>
        <h1>Earn on what<br /><em>happens next.</em></h1>
        <p className="hero-lede">Provide liquidity to prediction markets. Capture trading fees without choosing a side.</p>
        <div className="hero-actions">
          <a href="#markets" className="primary-action">Explore markets <Icon name="arrow" /></a>
          <a href="#mechanics" className="text-action">How the yield works</a>
        </div>
        <div className="hero-footnote"><Icon name="shield" /><span>Market-neutral intent, not risk-free. LPs remain exposed to informed flow and probability movement.</span></div>
      </div>
      <div className="hero-instrument market-terminal reveal reveal-delay">
        <div className="instrument-head terminal-head">
          <div><span>{sourceLive ? 'LIVE MARKET TERMINAL' : 'DEMO MARKET TERMINAL'}</span><strong>{market.category} / YES</strong></div>
          <div className={`live-chip ${sourceLive ? '' : 'is-demo'}`}><i /> {sourceLive ? 'PUBLIC DATA LIVE' : 'DEMO FALLBACK'}</div>
        </div>
        <div className="terminal-market-title">
          <div>
            <span>{market.sourceLabel ?? 'Probability'} · UPDATED {updated}</span>
            <h2>{market.question}</h2>
          </div>
          {market.sourceUrl ? <a href={market.sourceUrl} target="_blank" rel="noreferrer">SOURCE ↗</a> : null}
        </div>
        <div className="terminal-quote">
          <div><span>IMPLIED PROBABILITY</span><strong>{formatProbability(market.probability)}<sup>¢</sup></strong></div>
          <span className={positive ? 'up' : 'down'}>{positive ? '+' : ''}{market.change24h.toFixed(1)}pp <small>24H</small></span>
        </div>
        <MarketHistoryChart market={market} />
        <div className="instrument-stats terminal-stats">
          <div><span>24H VOLUME</span><strong>{formatCompactUsd(market.volume24h)}</strong></div>
          <div><span>LIQUIDITY</span><strong>{formatCompactUsd(market.liquidity)}</strong></div>
          <div><span>7D LOW</span><strong>{formatProbability(sevenDayLow)}¢</strong></div>
          <div><span>7D HIGH</span><strong>{formatProbability(sevenDayHigh)}¢</strong></div>
        </div>
      </div>
    </section>
  )
}
