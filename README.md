# Probability

**Probability** is a concept-stage DeFi protocol designed to help users earn yield from prediction-market activity without choosing a directional outcome.

Instead of betting on whether an event resolves to YES or NO, users provide liquidity to an automated market maker (AMM). Traders use that liquidity to buy and sell outcome exposure, while liquidity providers receive a share of trading fees.

> Probability is currently an early-stage concept. No production deployment, audited smart contracts, or guaranteed returns are available.

## Why Probability

Prediction markets are usually presented as tools for speculation. Probability explores a different model: treating prediction-market liquidity as a yield-generating DeFi asset.

The protocol is intended for two main groups:

- **Traders**, who need liquid markets and efficient probability pricing.
- **Liquidity providers**, who want exposure to market activity and fee revenue rather than selecting an event outcome.

## How it works

1. A prediction market is created with clearly defined outcomes, resolution rules, and an expiry date.
2. Liquidity providers deposit supported collateral into an AMM or managed liquidity vault.
3. Traders buy and sell outcome tokens against the available liquidity.
4. Trading fees accrue to liquidity providers according to their share of the pool.
5. After resolution, the oracle publishes the result and positions are settled.

## Important risk disclosure

Providing liquidity is not risk-free or perfectly market-neutral. Liquidity providers may lose money when probabilities move sharply, informed traders trade against stale prices, liquidity is concentrated in inactive markets, or a market is resolved incorrectly or ambiguously. Trading fees may not cover these losses.

Additional risks include smart-contract vulnerabilities, oracle failures, collateral depegging, governance attacks, and changing regulatory requirements.

## Proposed product components

- Prediction-market AMM
- Managed liquidity vaults
- Dynamic trading fees
- Market creation and curation
- Oracle and dispute-resolution layer
- LP analytics and transparent P&L reporting
- Risk controls around news events and market expiry

## Documentation

- [Protocol overview](docs/PROTOCOL_OVERVIEW.md)

## Prototype

The repository includes a dependency-free Python prototype of a binary LMSR
automated market maker. It demonstrates probability pricing, trade quotes,
price impact, fee collection, and market state tracking. It is educational code,
not production-ready smart-contract logic.

```bash
python -m pip install -e .
python examples/demo.py
python -m unittest discover -s tests -v
```

```python
from probability import BinaryLMSR

market = BinaryLMSR(liquidity=100, fee_bps=100)
quote = market.buy("YES", 25)
print(quote.total_cost)
print(market.snapshot())
```

## Status

The repository currently documents the product thesis and includes a small AMM
prototype. Smart contracts, production simulations, and audits are future work.

## Contributing

Feedback on AMM design, liquidity-provider risk, oracle mechanisms, market resolution, and regulatory considerations is welcome through GitHub issues.
