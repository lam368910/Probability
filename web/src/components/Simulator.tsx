import { useMemo, useState } from 'react'
import type { Market } from '../types/market'
import { calculateLiquidityQuote, calculateTradeQuote, formatUsd } from '../lib/format'
import { Icon } from './Icon'

export function Simulator({ market }: { market: Market }) {
  const [mode, setMode] = useState<'liquidity' | 'trade'>('liquidity')
  const [amount, setAmount] = useState(2500)
  const [days, setDays] = useState(30)
  const lpQuote = useMemo(() => calculateLiquidityQuote(amount, market.feeApr ?? 0, days), [amount, market.feeApr, days])
  const tradeQuote = useMemo(() => calculateTradeQuote(amount, market.probability, market.feeBps), [amount, market.probability, market.feeBps])
  const totalFeePercent = (market.feeBps / 100).toFixed(2)
  const feeSplit = market.protocolFeeShareBps === null
    ? 'SPLIT N/A'
    : `${((10_000 - market.protocolFeeShareBps) / 100).toFixed(0)}% LP / ${(market.protocolFeeShareBps / 100).toFixed(0)}% PROTOCOL`
  const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0

  return (
    <section className="simulator-section" id="simulator">
      <div className="simulator-copy">
        <span className="section-index light">02</span>
        <p className="eyebrow-text">POSITION LAB</p>
        <h2>Model the flow<br />before the funds.</h2>
        <p>Explore possible outcomes using recent fee activity. This is a deterministic demonstration—not a promise of returns.</p>
        <div className="formula-card">
          <span>LP RETURN MODEL</span>
          <p><b>Trading fees</b> + incentives</p><i>−</i>
          <p><b>Adverse selection</b> + inventory risk</p>
        </div>
      </div>
      <div className="simulator-panel">
        <div className="sim-tabs" role="tablist">
          <button role="tab" aria-selected={mode === 'liquidity'} className={mode === 'liquidity' ? 'active' : ''} onClick={() => setMode('liquidity')} type="button"><Icon name="droplet" /> Provide liquidity</button>
          <button role="tab" aria-selected={mode === 'trade'} className={mode === 'trade' ? 'active' : ''} onClick={() => setMode('trade')} type="button"><Icon name="spark" /> Trade outcome</button>
        </div>
        <div className="selected-market"><span>SELECTED MARKET</span><strong>{market.question}</strong><small>{market.probability}¢ YES · {market.feeApr === null ? 'fee APR unavailable' : `${market.feeApr}% est. fee APR`}</small></div>
        <label className="amount-input">
          <span>{mode === 'liquidity' ? 'AMOUNT TO SUPPLY' : 'AMOUNT TO TRADE'}</span>
          <div><b>$</b><input value={amount} min="0" inputMode="decimal" aria-label="USDC amount" onChange={(event) => setAmount(Number(event.target.value))} /><em>USDC</em></div>
        </label>
        {mode === 'liquidity' ? (
          <>
            <div className="duration-control"><div><span>TIME HORIZON</span><strong>{days} days</strong></div><input type="range" min="7" max="180" step="1" value={days} aria-label="Position duration" onChange={(event) => setDays(Number(event.target.value))} /><div className="range-labels"><span>7d</span><span>90d</span><span>180d</span></div></div>
            <div className="quote-grid">
              <div><span>EST. GROSS FEES</span><strong>{market.feeApr === null ? 'N/A' : formatUsd(lpQuote.grossFees)}</strong></div>
              <div><span>RANGE-RISK MODEL</span><strong>−{formatUsd(lpQuote.rangeLossEstimate)}</strong></div>
              <div className="net-quote"><span>MODELLED NET</span><strong>{market.feeApr === null ? 'N/A' : formatUsd(lpQuote.netEstimate)}</strong><small>Illustrative only</small></div>
            </div>
          </>
        ) : (
          <div className="quote-grid trade-quote">
            <div><span>AVG. PRICE</span><strong>{tradeQuote.executionProbability.toFixed(1)}¢</strong></div>
            <div><span>FEE ({totalFeePercent}% · {feeSplit})</span><strong>{formatUsd(tradeQuote.fee)}</strong></div>
            <div className="net-quote"><span>EST. YES SHARES</span><strong>{tradeQuote.shares.toFixed(2)}</strong><small>$1 if resolved Yes</small></div>
          </div>
        )}
        <button className="demo-submit" type="button" disabled={safeAmount <= 0}>{mode === 'liquidity' ? 'Preview LP position' : 'Preview demo trade'} <Icon name="arrow" /></button>
        <p className="panel-disclaimer"><Icon name="shield" /> Simulation only. No wallet or blockchain transaction will be initiated.</p>
      </div>
    </section>
  )
}
