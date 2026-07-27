# Probability Protocol Overview

## 1. Product thesis

Probability aims to make prediction-market activity accessible as a DeFi yield source. Its core proposition is:

> Earn fees from prediction-market trading by supplying liquidity instead of selecting the winning outcome.

This positioning does not mean that liquidity provision is outcome-independent or risk-free. An LP avoids making an explicit directional prediction, but still holds inventory whose value changes as market probabilities move.

## 2. Participants

### Traders

Traders buy and sell outcome exposure based on their information or beliefs. They benefit from deeper liquidity, lower slippage, and transparent pricing.

### Liquidity providers

LPs supply collateral or outcome inventory. In return, they receive trading fees and may receive additional protocol incentives. Their net return depends on fee revenue, inventory repricing, adverse selection, and market-resolution quality.

### Market creators and curators

Market creators define event questions, outcomes, deadlines, data sources, and resolution conditions. Curators may review proposed markets to reduce ambiguity and manipulation.

### Resolvers and disputers

An oracle or resolution mechanism determines the final result. A dispute process should handle ambiguous, delayed, or contested outcomes.

## 3. Lifecycle of a market

1. **Creation** — A market is proposed with an unambiguous question, outcome set, closing time, and resolution source.
2. **Review** — Automated and community controls check wording, duplicates, prohibited content, and resolvability.
3. **Liquidity bootstrapping** — LPs or protocol vaults seed the market.
4. **Trading** — Prices move between 0 and 1 and represent market-implied probabilities before fees and other distortions.
5. **Close** — Trading stops at the defined cutoff or enters a restricted settlement period.
6. **Resolution** — The oracle reports an outcome, followed by a dispute window where applicable.
7. **Settlement** — Winning outcome tokens redeem for collateral and LP positions settle.

## 4. LP economics

An LP's simplified net return can be expressed as:

```text
Net LP return
= trading fees
+ protocol incentives
- losses from probability changes
- adverse-selection losses
- oracle and resolution losses
- operational and protocol costs
```

The primary economic challenge is adverse selection. A trader may act immediately after receiving new information while an AMM still quotes stale prices. The protocol therefore needs risk controls that do more than distribute a fixed fee.

## 5. Proposed risk controls

### Dynamic fees

Fees can increase when volatility, order imbalance, or information risk rises. Parameters should be transparent and validated through simulation.

### Managed liquidity vaults

Vaults can diversify liquidity across independent markets, cap exposure to a single event, and rebalance capital as volume and risk change.

### Market-quality standards

Every market should use precise wording, a predefined source of truth, explicit edge-case rules, and a dispute period proportional to resolution risk.

### Expiry controls

Risk limits may tighten as a market approaches a known announcement or settlement deadline. Possible controls include reduced liquidity, higher fees, trade-size limits, or temporary pauses under narrowly defined conditions.

### Insurance or junior capital

A separate reserve or junior-risk tranche could absorb defined categories of loss. Such protection must be fully capitalized and should never be described as a guarantee.

## 6. Initial architecture

The protocol may be separated into the following modules:

- **Collateral vault** — Holds supported assets and accounts for deposits and withdrawals.
- **Outcome-token layer** — Mints and redeems conditional claims.
- **AMM or pricing engine** — Quotes outcomes and executes trades.
- **Fee controller** — Adjusts fees according to market conditions.
- **Liquidity router** — Allocates capital across eligible markets.
- **Oracle adapter** — Receives resolution data from approved sources.
- **Dispute module** — Manages challenges and final settlement.
- **Governance and safety controls** — Applies parameter changes, limits, and emergency actions.
- **Analytics layer** — Separates earned fees from mark-to-market and settlement P&L.

## 7. Suggested MVP

The first testable version should stay intentionally narrow:

- Binary YES/NO markets
- One stable collateral asset
- Curated market creation
- A single documented oracle flow
- Basic AMM with explicit fee accounting
- LP dashboard showing fees, inventory exposure, and net P&L
- Simulations and testnet deployment before accepting real funds

The MVP should optimize for measurable market quality rather than the number of markets.

## 8. Metrics

Useful protocol metrics include:

- Organic trading volume
- Active liquidity and liquidity utilization
- Slippage by trade size
- LP net return after inventory losses
- Fee revenue without token incentives
- Market concentration and correlation
- Resolution time and dispute frequency
- Share of markets with unambiguous settlement

## 9. Open design decisions

- Which AMM model best limits losses to informed flow?
- Should liquidity be isolated per market or shared through vaults?
- How should dynamic fees respond to volatility and scheduled news?
- Which oracle and dispute design matches the target market categories?
- Who may create markets during the MVP?
- Which jurisdictions and user groups can the protocol support?
- Will governance have emergency powers, and how will those powers be constrained?

## 10. Development sequence

1. Formalize market and settlement rules.
2. Simulate AMM behavior under probability jumps and informed trading.
3. Define LP accounting and risk disclosures.
4. Implement and test the minimal smart-contract system.
5. Commission independent security and economic reviews.
6. Run a limited testnet pilot with transparent performance reporting.

## Disclaimer

This document describes an experimental protocol concept and is not financial, legal, or investment advice. It does not promise yield, capital protection, or future token value.
