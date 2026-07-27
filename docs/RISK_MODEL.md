# Risk model and scenario simulation

The simulation layer is designed for transparent stress testing, not for
predicting future profit. It creates a seeded latent probability path, noise
traders, and informed traders, then reconciles the LP position at mark-to-market
and at resolution.

## Modeled risks

### Adverse selection

Informed agents quote their full sampled order size and compare its expected
payout with total execution cost, including price impact and fees. They trade
only when the average per-share edge clears a configured threshold. When their information is accurate, this
flow tends to leave the AMM with liabilities that cost more than the collateral
received. The `gross_mtm_trading_loss` metric reports the positive part of:

```text
expected liability at final fair value − gross trade cash
```

It is reported before fees so operators can see whether fees cover the modeled
gross trading loss. It is not labelled as adverse-selection attribution because
noise flow can also create mark-to-market losses; causal attribution would
require a matched counterfactual.

### Probability shocks

The latent probability follows a noisy bridge from an initial value toward a
configured terminal value. `daily_probability_volatility` controls path noise.
The bundled `NEWS_SHOCK` scenario combines a large terminal move, high
volatility, and a high informed-trader share. `CALM_MARKET` provides a milder
comparison. These presets are illustrative and are not calibrated to a specific
market or historical dataset.

### Resolution

Normal resolution pays 1 to winning shares and 0 to losing shares. Invalid or
ambiguous markets may use a split payout. Simulation callers can fix the outcome
for deterministic stress tests or allow a seeded draw from the final latent
probability.

## Example

```python
from probability import MarketSpec, NEWS_SHOCK, Resolution, run_simulation

spec = MarketSpec(
    market_id="market-1",
    question="Will the event happen?",
    liquidity=10_000,
    fee_bps=100,
    duration_days=30,
)
result = run_simulation(
    NEWS_SHOCK.apply(spec, seed=42),
    resolution=Resolution.winner("YES"),
)

print(result.realized.net_pnl)
print(result.realized.yield_metrics.net_return)
print(result.gross_mtm_trading_loss)
```

## Important limitations

The model currently assumes buy-only flow and a single collateral unit. It does
not model order splitting, MEV, latency, arbitrage networks, liquidity changes,
LP entry/exit, correlated markets, trader bankroll constraints, gas, dynamic
fees, oracle delays, disputes, collateral depegs, exploits, liquidations, token
incentives, or legal restrictions. The latent path and trader types are synthetic.

Before using the results for capital allocation, teams should calibrate inputs
against actual market data, run many seeds and tail scenarios, validate the
oracle and invalid-resolution rules, include all costs, and independently audit
the contracts and accounting. No scenario or annualized metric guarantees that
an LP will earn a profit or recover principal.
