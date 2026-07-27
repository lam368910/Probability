# Security and Compliance Gates

## Status

The code in this repository is an engineering prototype. It is not audited and must not custody real user funds.

## Threat model

### Smart-contract threats

- Reentrancy and unsafe token callbacks
- Incorrect LP-share valuation
- Rounding and precision extraction
- Insolvency after extreme trades
- Fee-accounting errors
- Trading after close or resolution
- Unauthorized pause or resolution
- Denial of service through malicious collateral

Recommended implementation controls include checks-effects-interactions, `SafeERC20`, explicit role separation, reentrancy protection, pausing, invariant tests, and conservative supported-token rules. OpenZeppelin emphasizes that access control is critical and recommends stronger admin patterns, delays, and multisig/governance custody as systems mature: [OpenZeppelin access-control documentation](https://docs.openzeppelin.com/contracts/5.x/access-control).

### Economic threats

- Informed order flow around announcements
- Thin-liquidity price manipulation
- Wash volume designed to farm incentives
- Correlated market exposure
- Liquidity flight before settlement
- Misleading gross-APY presentation

### Oracle threats

- Ambiguous market wording
- Source outage or retroactive correction
- Resolver bribery or key compromise
- Insufficient dispute bond
- Late settlement and capital lockup

### Operational threats

- Frontend compromise or DNS takeover
- Malicious contract-address substitution
- RPC/indexer inconsistency
- Lost admin keys
- Incident communication failure

## Mainnet release gates

All items are mandatory:

- [ ] Two independent smart-contract security reviews
- [ ] Economic/mechanism-design review
- [ ] Property and invariant testing with documented coverage
- [ ] Public testnet with a minimum observation period
- [ ] Oracle failure and dispute exercises
- [ ] Multisig ownership with hardware-backed signers
- [ ] Timelocked non-emergency parameter changes
- [ ] Monitoring for balances, solvency, roles, pauses, and resolutions
- [ ] Bug bounty and security contact
- [ ] Incident-response runbook and public status channel
- [ ] Jurisdiction-specific legal opinion
- [ ] KYC/AML, sanctions, geofencing, privacy, and consumer-disclosure decisions
- [ ] Accurate risk disclosures and prohibited marketing claims

## Regulatory boundary

Prediction markets can be treated as regulated event-contract derivatives. The U.S. CFTC explains that event contracts are commonly structured as swaps or futures and that binary contracts have fixed payout and expiry. In March 2026 it issued an advisory reminding registered markets of their obligations, and it was still gathering input for potential rulemaking: [CFTC overview](https://www.cftc.gov/LearnandProtect/PredictionMarkets), [CFTC 2026 advisory](https://www.cftc.gov/PressRoom/PressReleases/9193-26), and [2026 rulemaking notice](https://www.cftc.gov/LawRegulation/FederalRegister/proposedrules/2026-05105.html).

In the EU, MiCA does not automatically replace existing financial-services law: crypto-assets that qualify as financial instruments are excluded from MiCA and remain under the existing framework. A prediction-market token therefore requires classification analysis rather than a blanket "MiCA compliant" claim: [Regulation (EU) 2023/1114](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114).

This repository does not provide legal advice. Deployment must be restricted until counsel defines allowed entities, markets, users, and jurisdictions.

## Marketing rules

Do not claim:

- guaranteed yield;
- market-neutral or risk-free returns;
- audited or insured status without evidence;
- regulatory approval without a specific written authorization;
- historical gross fees as expected net return.

Every APY display must state its measurement window, annualization method, incentive component, and whether inventory P&L is included.

