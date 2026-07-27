# Roadmap and Release Criteria

## Phase 1 — Public engineering demo

- Polished responsive web experience
- Deterministic demo markets and portfolio
- Interactive trading and LP-risk simulations
- Tested Python economic model
- Tested local Solidity market prototype
- Reproducible local setup and CI

Exit criterion: a new contributor can clone, test, and run the complete demo from documented commands.

## Phase 2 — Integrated local protocol

- Web wallet integration
- Contract deployment on a local EVM node
- Contract-event ingestion
- End-to-end trade, LP deposit, resolution, and redemption
- Admin operations console

Exit criterion: automated end-to-end tests cover the complete market lifecycle.

## Phase 3 — Public testnet

- Verified deployments and published addresses
- Mock or faucet collateral
- Resolver adapter and dispute demonstration
- Monitoring, alerting, and public status page
- Load, fuzz, invariant, and failure-recovery testing

Exit criterion: a time-boxed pilot completes without loss of accounting integrity.

## Phase 4 — Restricted real-value pilot

Prerequisites include legal approval, completed independent audits, a bug bounty, multisig/timelock controls, exposure caps, and an accountable oracle path.

Exit criterion: limited cohorts demonstrate positive net LP economics after all costs, without token incentives.

## Phase 5 — Scale

- Diversified managed vaults
- Dynamic fees and liquidity routing
- Institutional reporting and APIs
- Approved partner market creation
- Additional collateral and chain support only after isolated risk review

## Explicit non-goals for early releases

- Permissionless market creation
- Anonymous admin control
- Algorithmic claims of guaranteed yield
- Governance token before product-market fit
- Cross-chain collateral before the single-chain model is proven

