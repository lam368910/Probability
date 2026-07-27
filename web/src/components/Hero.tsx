import type { ProtocolStats } from '../types/market'
import { formatCompactUsd } from '../lib/format'
import { Icon } from './Icon'

export function Hero({ stats }: { stats: ProtocolStats }) {
  return (
    <section className="hero" id="top">
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
      <div className="hero-instrument reveal reveal-delay">
        <div className="instrument-head">
          <div><span>PROBABILITY INDEX</span><strong>PRB–24</strong></div>
          <div className="live-chip"><i /> DEMO DATA</div>
        </div>
        <div className="dial-wrap">
          <div className="dial-rings"><i /><i /><i /></div>
          <div className="dial-value"><small>SIMULATED TVL</small><strong>{formatCompactUsd(stats.tvl)}</strong><span>across {stats.activeMarkets} demo markets</span></div>
          <div className="dial-marker marker-one">FEE FLOW</div>
          <div className="dial-marker marker-two">DEPTH</div>
        </div>
        <div className="instrument-stats">
          <div><span>DEMO 30D VOLUME</span><strong>{formatCompactUsd(stats.volume30d)}</strong></div>
          <div><span>DEMO LP FEES</span><strong>{formatCompactUsd(stats.fees30d)}</strong></div>
          <div><span>UTILIZATION</span><strong>72.8%</strong></div>
        </div>
      </div>
    </section>
  )
}
