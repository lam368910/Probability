import { useMemo, useState } from 'react'
import type { Market } from '../types/market'
import { calculateLiquidityQuote, calculateTradeQuote, formatUsd } from '../lib/format'
import { parseUsdcAmount } from '../lib/usdc'
import { Icon } from './Icon'
import type { ArcWallet } from '../hooks/useArcWallet'

export function Simulator({ market, wallet }: { market: Market; wallet: ArcWallet }) {
  const [mode, setMode] = useState<'liquidity' | 'trade'>('liquidity')
  const [amount, setAmount] = useState('2500')
  const [days, setDays] = useState(30)
  const amountNumber = Number(amount)
  const safeAmount = Number.isFinite(amountNumber) && amountNumber >= 0 ? amountNumber : 0
  const parsedAmount = useMemo(() => parseUsdcAmount(amount), [amount])
  const lpQuote = useMemo(() => calculateLiquidityQuote(safeAmount, market.feeApr ?? 0, days), [safeAmount, market.feeApr, days])
  const tradeQuote = useMemo(() => calculateTradeQuote(safeAmount, market.probability, market.feeBps), [safeAmount, market.probability, market.feeBps])
  const totalFeePercent = (market.feeBps / 100).toFixed(2)
  const feeSplit = market.protocolFeeShareBps === null
    ? 'SPLIT N/A'
    : `${((10_000 - market.protocolFeeShareBps) / 100).toFixed(0)}% LP / ${(market.protocolFeeShareBps / 100).toFixed(0)}% PROTOCOL`
  const busy = wallet.status === 'pending' || wallet.status === 'connecting'
  const actionReady = Boolean(parsedAmount) && wallet.deploymentReady && !busy
  const connectedToArc = Boolean(wallet.account) && wallet.networkReady
  const externalReference = market.source === 'polymarket'
  const actionLabel = !wallet.deploymentReady
    ? 'Arc deployment not configured'
    : busy
      ? wallet.status === 'pending' ? 'Waiting for Arc finality…' : 'Connecting wallet…'
      : !wallet.account
        ? 'Connect wallet to continue'
        : !wallet.networkReady
          ? 'Switch wallet to Arc'
          : mode === 'liquidity' ? 'Add liquidity on Arc' : 'Buy YES on Arc'

  return (
    <section className="simulator-section" id="simulator">
      <div className="simulator-copy">
        <span className="section-index light">02</span>
        <p className="eyebrow-text">POSITION LAB</p>
        <h2>Model the flow<br />before the funds.</h2>
        <p>{externalReference ? 'Use the external market price as a read-only scenario input. Probability yield is unavailable until a matching Arc market is configured.' : 'Explore possible outcomes using recent fee activity. This is a deterministic demonstration—not a promise of returns.'}</p>
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
        <div className="selected-market"><span>{externalReference ? 'EXTERNAL REFERENCE MARKET' : 'SELECTED MARKET'}</span><strong>{market.question}</strong><small>{market.probability}¢ YES · {externalReference ? 'read-only 7D source data' : market.feeApr === null ? 'fee APR unavailable' : `${market.feeApr}% est. fee APR`}</small></div>
        <label className="amount-input">
          <span>{mode === 'liquidity' ? 'AMOUNT TO SUPPLY' : 'AMOUNT TO TRADE'}</span>
          <div><b>$</b><input value={amount} inputMode="decimal" autoComplete="off" aria-label="USDC amount" aria-invalid={amount.length > 0 && !parsedAmount} onChange={(event) => setAmount(event.target.value)} /><em>USDC</em></div>
          {amount.length > 0 && !parsedAmount ? <small className="amount-error">Use a positive amount with at most 6 decimal places.</small> : null}
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
        <div className="onchain-target" role="note">
          <span>ONCHAIN ACTION TARGET</span>
          <strong>{wallet.deploymentReady ? wallet.marketQuestion : 'No Arc market address configured'}</strong>
          <small>{externalReference ? 'The selected discovery market is a read-only external reference. This button only acts on the named Arc Testnet contract and never places a Polymarket trade.' : 'The market cards and estimates above are demo analytics. The button below only acts on this named Arc Testnet contract.'}</small>
        </div>
        <button
          className="demo-submit"
          type="button"
          disabled={!actionReady}
          onClick={() => connectedToArc
            ? void (mode === 'liquidity' ? wallet.provideLiquidity(amount) : wallet.buyYes(amount))
            : void wallet.connect()}
        >
          {actionLabel} <Icon name="arrow" />
        </button>
        <p className="panel-disclaimer"><Icon name="shield" /> {wallet.deploymentReady ? 'Onchain actions use testnet USDC. Keep at least 0.01 USDC for Arc gas; testnet assets have no value.' : 'Simulation remains available while deployment is staged.'}</p>
      </div>
    </section>
  )
}
