# Probability Product Strategy

## Executive decision

Probability should launch as **liquidity infrastructure and analytics for curated binary markets**, not as a permissionless betting venue and not as a product that promises passive yield.

The defensible product is a managed LP experience that makes four things visible:

1. fee income;
2. inventory and probability exposure;
3. losses to informed order flow;
4. net return after all three.

That distinction matters. Gross fee APY can be positive while an LP loses money after a probability jump.

## Target users

### Primary: sophisticated liquidity providers

- Crypto-native funds and market makers
- DeFi users who understand smart-contract and inventory risk
- Treasuries seeking diversified, short-duration fee strategies

### Secondary: event traders

- Users seeking transparent execution and visible price impact
- Hedgers with real-world event exposure
- Researchers using market prices as forecasting signals

Retail users should not be targeted with language implying guaranteed or risk-free yield.

## Product surface

### LP vault

- Deposit supported collateral
- See current inventory, utilization, fees, and marked P&L
- Preview withdrawals and settlement exposure
- Choose risk tier and market category

### Markets

- Curated, unambiguous binary questions
- Transparent source of truth and resolution timestamp
- Visible spread, liquidity, volume, and dispute status
- Trade preview before execution

### Risk terminal

- Probability-shock scenarios
- Fee break-even analysis
- Market concentration and correlation
- Oracle, expiry, and governance alerts

### Operations console

- Market proposal and review workflow
- Exposure caps and dynamic fee parameters
- Pause, resolve, dispute, and incident tooling
- Immutable audit trail for privileged actions

## Sustainable revenue

Potential protocol revenue sources are:

- a disclosed share of trading fees;
- a disclosed vault management or performance fee;
- market-creation fees for approved partners;
- professional analytics/API subscriptions;
- white-label liquidity infrastructure.

Token emissions are a customer-acquisition cost, not revenue. They must never be included when presenting sustainable protocol income.

## Unit economics

```text
Gross trading fees = organic volume × effective fee rate
LP net return       = LP fee share - inventory loss - adverse selection - operating costs
Protocol revenue    = gross fees × protocol share + service revenue
Contribution margin = protocol revenue - oracle - chain - indexing - support - incentives
```

The protocol has product-market fit only if LP cohorts achieve competitive **net** risk-adjusted returns without relying on token incentives.

## Competitive advantage

An AMM contract alone is not a moat. Probability should compete on:

- market-quality and resolution standards;
- risk-aware capital routing;
- dynamic fees around information events;
- auditable LP accounting;
- diversified vault construction;
- oracle and dispute operations;
- compliance-ready market and jurisdiction controls.

## Major advantages

- Fee-based revenue can be more sustainable than token emissions.
- LPs expand the addressable market beyond directional traders.
- Shared analytics can make fragmented prediction liquidity investable.
- Binary markets provide simple settlement and interpretable prices.
- Short-duration markets can recycle capital rapidly.

## Major disadvantages

- Informed traders can extract more value than fees generate.
- Liquidity fragments across questions, outcomes, and expiries.
- Resolution disputes can freeze capital and destroy trust.
- A permissionless market layer increases manipulation and legal risk.
- Demand may be seasonal and concentrated in a few headline events.
- Smart-contract, collateral, bridge, governance, and oracle failures are correlated tail risks.

## Launch recommendation

Start with a closed pilot:

- testnet or points-only collateral;
- 5–10 curated markets;
- one collateral asset;
- conservative exposure caps;
- multisig-controlled resolver with a public evidence log;
- no token and no advertised APY;
- weekly LP attribution reports.

Real funds should be accepted only after every gate in [Security and compliance](SECURITY_AND_COMPLIANCE.md) is satisfied.

