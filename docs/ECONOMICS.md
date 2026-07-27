# Protocol economics

Probability has two deliberately separate economic models. The Python analytics
API uses a binary logarithmic market scoring rule (LMSR) for research and stress
testing. The deployable Solidity prototype uses a fully collateralized
fixed-product AMM with LP shares. LMSR quotes, capital bounds, and simulation
results do **not** describe or bound the Solidity market's LP outcomes.

## Research model: LMSR

The liquidity parameter `b` controls depth: a larger value produces less price
movement for a given trade and requires more LP capital.

## Capital and cash flows

For a binary LMSR initialized at 50/50, the scoring-rule worst-case subsidy is:

```text
capital at risk = b × ln(2)
```

That is a mathematical bound on the market maker's trading loss before fees. It
is not a bound on oracle failure, collateral depeg, contract exploits,
governance actions, operational costs, or other protocol risks.

The accounting implementation separates four quantities:

1. **Gross trade cash** — collateral paid into the LMSR cost function.
2. **Fees** — the additional fee charged on each purchase.
3. **Settlement liability** — winning shares multiplied by their payout.
4. **LP P&L** — gross trade cash + fees − settlement liability.

This distinction matters. Fee revenue is not the same as LP profit. A market can
show positive fees and a negative net result when better-informed traders buy
underpriced winning claims.

## Return metrics

The analytics API reports fee return and net return separately:

```text
fee return = fees / capital at risk
net return = realized or mark-to-market P&L / capital at risk
APR = period return × 365 / deployment days
APY = (1 + period return)^(365 / deployment days) − 1
```

APY mechanically assumes that the same period result can be reinvested and
repeated throughout a year. Prediction-market opportunities, volumes, event
risks, and losses are not stable or repeatable, so APY should be treated only as
a normalized comparison metric. It is not a forecast. When a period loses 100%
or more of modeled capital, compound APY is undefined and the API returns
`None`.

## Mark-to-market and settlement

Before resolution, expected liability is valued using an explicitly supplied
external fair probability:

```text
expected liability = YES shares × fair P(YES)
                   + NO shares × (1 − fair P(YES))
```

The AMM price is not automatically treated as fair value, because informed flow
or stale pricing can make that circular. At resolution, the model accepts either
a 1/0 winner payout or a configurable invalid-market split such as 0.5/0.5.

## Using the API

```python
from probability import BinaryLMSR, Resolution, value_lp

market = BinaryLMSR(liquidity=10_000, fee_bps=100)
market.buy("YES", 500)

mark = value_lp(market, duration_days=30, fair_yes_probability=0.62)
final = value_lp(market, duration_days=30, resolution=Resolution.winner("YES"))
```

The Solidity market splits each trading fee between LPs and a disclosed protocol
treasury. The factory's configured share applies immutably to each newly created
market; it cannot be raised for an existing market. Treasury revenue is gross
fee revenue, not guaranteed profit, and must cover operations, audits, oracle
costs, legal/compliance work, and taxes.

Production deployments should additionally account for gas, keeper/oracle
costs, idle capital, incentives, withdrawals, bad debt,
collateral yield, and reserve requirements. Those are intentionally not hidden
inside this prototype's return figures.
