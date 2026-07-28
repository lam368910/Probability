# Probability Architecture

## System boundary

Probability is designed as four separable layers:

```text
Web application
  -> indexer / analytics API
  -> market and liquidity contracts
  -> collateral token + resolution adapter
```

The web application is not trusted for pricing or settlement. Contracts remain the source of truth for balances and market state. The analytics service computes presentation metrics and simulations, but users must be able to reconcile values against on-chain events.

## Components

### Web application

- Market discovery and transparent resolution rules
- Read-only Polymarket Gamma discovery and CLOB seven-day price history with explicit source attribution
- Trade and liquidity previews
- Wallet connection and transaction lifecycle
- LP portfolio and risk scenarios
- Demo mode for public presentation without a wallet

External discovery data is never treated as Probability settlement data or as proof of an available Arc market. When the public feed is unavailable, the client switches to visibly labeled deterministic demo markets.

### Analytics service

- Event ingestion and market snapshots
- Fee, volume, utilization, and net-P&L attribution
- Stress tests and adverse-selection scenarios
- Read-only public API with cached responses

### Smart contracts

- Collateral custody
- Market lifecycle and AMM state
- LP share accounting
- Fee accrual and protocol fee separation
- Resolution and redemption
- Emergency pause and role boundaries

### Resolution layer

Production resolution should be an adapter rather than hard-coded business logic. Candidate designs include:

- an optimistic oracle with an economically meaningful dispute bond;
- a decentralized workflow that reads multiple authoritative sources;
- a regulated or contractually accountable data provider;
- a multisig fallback used only under publicly documented emergency rules.

Chainlink's current orchestration product is CRE; its documentation says legacy Chainlink Functions sunset in June 2026, while CRE production deployment remains Early Access. Any Chainlink path must therefore be evaluated against the current [CRE deployment status](https://docs.chain.link/cre), not older Functions tutorials.

## Market lifecycle

```text
Draft -> Reviewed -> Open -> Trading closed -> Proposed result
      -> Dispute window -> Finalized -> Redeemable -> Archived
```

Terminal states must not be reversible. A paused market is operationally restricted but not resolved.

## Accounting invariants

- Contract collateral must cover all redeemable claims and owed withdrawals.
- YES and NO probabilities must remain bounded and internally consistent.
- Protocol fees must not be counted as LP-owned liquidity.
- LP share minting and burning must use one documented valuation basis.
- Resolution must prevent additional trading and liquidity changes.
- Rounding must not permit repeated value extraction.
- All privileged state changes must emit events.

## Trust boundaries

| Boundary | Primary threat | Required control |
|---|---|---|
| Wallet to web | malicious transaction | human-readable previews, verified addresses |
| Web to API | false analytics | on-chain reconciliation, signed releases |
| API to RPC | stale or forked data | confirmations, multiple providers |
| Contracts to collateral | non-standard ERC-20 behavior | SafeERC20, allowlist, invariant tests |
| Contracts to resolver | false or ambiguous result | evidence, bond, dispute window |
| Admin to contracts | key compromise | multisig, least privilege, delay |

## Deployment profiles

### Demo

Static frontend, deterministic sample data, in-browser simulations. No wallet or funds required.

### Local integration

Local EVM node, mock collateral, deployed contracts, analytics service, and web application.

### Public testnet

Verified contracts, test collateral, public monitoring, rate limits, and an explicitly centralized test resolver.

### Mainnet

Unavailable until independent audits, economic review, oracle integration, legal approval, monitoring, incident response, and governance hardening are complete.
