import type { Market, Portfolio } from '../types/market'
import { formatUsd } from '../lib/format'
import { Icon } from './Icon'

export function PortfolioView({ portfolio, markets }: { portfolio: Portfolio; markets: Market[] }) {
  return (
    <section className="portfolio-section" id="portfolio">
      <div className="section-heading compact"><div><span className="section-index">03</span><p className="eyebrow-text">DEMO PORTFOLIO</p><h2>Capital, accounted for.</h2></div><p>A transparent mock position ledger showing the future wallet experience.</p></div>
      <div className="portfolio-shell">
        <aside className="portfolio-balance">
          <span>TOTAL POSITION VALUE</span><h3>{formatUsd(portfolio.balance)}</h3><p><b>+{portfolio.pnl30d}%</b> over the past 30 days</p>
          <div className="balance-orbit"><span><Icon name="wallet" /></span><i style={{ transform: `rotate(${portfolio.pnl30d * 12}deg)` }} /></div>
          <dl><div><dt>Liquidity supplied</dt><dd>{formatUsd(portfolio.supplied)}</dd></div><div><dt>Fees earned</dt><dd>{formatUsd(portfolio.feesEarned)}</dd></div><div><dt>Active positions</dt><dd>{portfolio.positions}</dd></div></dl>
        </aside>
        <div className="position-list">
          <div className="position-head"><span>MARKET</span><span>SUPPLIED</span><span>FEE APR</span><span>RISK</span><span /></div>
          {markets.slice(0, 3).map((market, index) => (
            <div className="position-row" key={market.id}>
              <div><i>{String(index + 1).padStart(2, '0')}</i><span>{market.question}<small>{market.category} · resolves {market.closesAt}</small></span></div>
              <strong>{formatUsd([3600, 2800, 2000][index])}</strong><strong className="green">{market.feeApr === null ? 'N/A' : `${market.feeApr}%`}</strong><span className={`risk risk-${market.risk.toLowerCase()}`}>{market.risk}</span><button type="button" aria-label={`View ${market.question}`}><Icon name="chevron" /></button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
