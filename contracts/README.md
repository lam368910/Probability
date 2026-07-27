# Probability contracts

> **Security status:** unaudited, testnet-only reference implementation. Do not use with real funds.

`BinaryPredictionMarket.sol` implements one fully collateralized YES/NO market per deployment:

- fixed-product AMM with exact-input buys and exact-collateral-output sells;
- LP shares, price-preserving liquidity additions, and liquidity removal with minimum collateral and YES/NO inventory bounds;
- each trading fee is split between LPs and an immutable protocol treasury;
- LP fees are paid pro rata on liquidity removal, while the treasury can claim its accrued share;
- internal YES/NO balances, oracle resolution, 1:1 redemption of winning shares, and 50/50 invalid-market settlement;
- two-step ownership, replaceable oracle, pause control, deadlines, slippage bounds, reentrancy guard, exact ERC-20 transfer checks, and solvency assertions.
- a per-market minimum reserve that prevents trades or pre-resolution LP withdrawals from draining active liquidity.

`ProbabilityMarketFactory.sol` deploys and indexes multiple independent markets. Creation is owner-only by default; the factory owner can explicitly enable permissionless creation. Market owner and oracle are provided for every market and are not inherited from the factory. The factory is non-upgradeable. Its treasury and protocol share (capped at 50% of the trading fee) apply only to future markets; each deployed market stores those terms immutably.

## Run locally

```sh
npm install
npm test
```

For an intentional testnet deployment, configure a network in `hardhat.config.js`, set `FACTORY_OWNER`, and run `npm run deploy -- --network <network>`. Direct single-market deployment remains available through `npm run deploy:market -- --network <network>` using the remaining values in `.env.example`. The repository intentionally contains no RPC URL or private key. Deployment never seeds a market; initialization is a separate, explicit collateral approval and `initialize(seedAmount)` transaction.

## Lifecycle

1. Configure a disclosed treasury and protocol fee share on the factory, then call `createMarket` with collateral token, non-empty human-readable question, close timestamp, total trading fee, minimum reserve, oracle, and market owner. Choose the minimum reserve using the collateral token's decimals and expected market depth.
2. Any account calls `initialize` once to seed equal YES and NO reserves.
3. Before `closeTime`, users trade or add/remove liquidity.
4. At or after `closeTime`, only the oracle calls `resolve`, or `resolveInvalid` for an ambiguous/cancelled market.
5. Winning token holders call `redeem`; invalid markets pay 0.5 collateral per YES or NO share. LPs call `removeLiquidity` to redeem their pro-rata resolved inventory and fees.

Outcome and LP shares are deliberately internal accounting balances, not ERC-1155/ERC-20 tokens. Integrations should use the view methods and events.

## Known limitations / security caveats

- No professional audit, formal verification, fuzzing campaign, bug bounty, or mainnet operational review has occurred.
- Oracle resolution is trusted and final. Invalid settlement exists, but there is no dispute window, multisig enforcement, or optimistic oracle integration.
- The owner can pause trading/liquidity addition and replace the oracle. Removal, resolution, and redemption remain available to preserve exits.
- Only conventional, non-rebasing, non-fee-on-transfer ERC-20 collateral is supported. Tokens with callbacks, blacklists, unusual decimals, or transfer behavior require separate review.
- Arithmetic uses Solidity checked math, but multiplication-based `mulDiv` is not 512-bit and can overflow at unrealistically high token quantities.
- Hardhat and its transitive development-only toolchain currently report audit findings even though `npm audit --omit=dev` is clean. Keep deployment workstations isolated, review lockfile updates, and migrate the toolchain before production operations.
- Prices are manipulable in shallow pools. There is no TWAP, circuit breaker, maximum trade-size rule, MEV protection, or front-end quote signing.
- LPs face loss-versus-rebalancing, informed-flow/adverse-selection risk, inventory risk, oracle risk, and possible fees below losses. Yield is not guaranteed.
- The factory validates basic parameters and indexes deployments, but does not guarantee question uniqueness/clarity, provide governance, or enforce jurisdictional access restrictions.
- LP fee accounting is realized on LP withdrawal; there is no standalone LP fee claim or transferable LP token.
- Protocol treasury revenue is gross fee revenue, not profit. The factory owner can change terms for future markets, so the UI must display each market's immutable fee split before users transact.
- Rounding favors pool safety and may leave small amounts of collateral/shares. A production design needs audited dust handling and an eventual sweep policy that cannot take user liabilities.

Before production, add an audited factory, audited math library, invariant/fuzz tests, dispute-capable oracle, multisig/timelock administration, monitoring, emergency playbooks, independent audits, and legal review.
