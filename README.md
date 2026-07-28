# Probability

**Probability** is prediction-market liquidity infrastructure for traders and liquidity providers. It combines a live Arc Testnet AMM, a wallet-connected public interface, a reproducible LP risk engine, and a read-only analytics API.

**Public demo:** <https://lam368910.github.io/Probability/>

**Arc Testnet:** [factory](https://testnet.arcscan.app/address/0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601) · [market](https://testnet.arcscan.app/address/0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42) · [YES trade](https://testnet.arcscan.app/tx/0x72c9c287ff2bea33379f5c2d068da23b25eff9aeb49c372bafc011104bcc35be) · [liquidity deposit](https://testnet.arcscan.app/tx/0x6a0eb79e63afd3556a8a3079242e479938319b1a2f186d569132131d592e2c7d)

> **Current status: working, unaudited Arc Testnet MVP.** Testnet USDC has no value. No component in this repository promises profit, protects principal, or is approved to custody real funds.

## What works today

- Arc Testnet wallet connection, chain switching, public state reads, USDC approvals, YES purchases, and liquidity deposits
- Responsive React market, portfolio, and simulation interface with explicit separation between demo analytics and onchain actions
- Binary fixed-product Solidity AMM with internal YES/NO positions
- Immutable per-market LP/protocol fee split with treasury revenue collection
- LP deposits, withdrawals, fee accounting, slippage limits, and redemptions
- Normal YES/NO and 50/50 invalid-market settlement
- Owner-controlled multi-market factory and registry
- Pause, reentrancy guard, reserve floor, solvency checks, and two-step ownership
- Python LMSR research model and seeded adverse-selection simulations
- LP mark-to-market, realized P&L, fee APR/APY, and capital-at-risk metrics
- FastAPI endpoints for demo markets, trade quotes, and LP stress tests
- Docker Compose, CI, verification scripts, and GitHub Pages deployment

## Arc MVP evidence

The public deployment uses Arc Testnet chain ID `5042002` and the official 6-decimal USDC ERC-20 interface at `0x3600000000000000000000000000000000000000`. The seeded market asks whether the Arc Programmable Money Hackathon will reach Demo Day on August 20, 2026.

| Artifact | Public evidence |
|---|---|
| Factory | [`0x9d86…9601`](https://testnet.arcscan.app/address/0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601) |
| Market | [`0x6C61…FA42`](https://testnet.arcscan.app/address/0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42) |
| Factory deployment | [Arcscan transaction](https://testnet.arcscan.app/tx/0x27501f61c889a4f98e21208834457e9fdd4c7bf1483a100f6f8296cb2843a84c) |
| Market initialization | [Arcscan transaction](https://testnet.arcscan.app/tx/0x9cd2f1072da7a5c75b529c9718118352713dbe85278aaf5e5cf8ffce6218e3d2) |
| Canonical YES trade | [Arcscan transaction](https://testnet.arcscan.app/tx/0x72c9c287ff2bea33379f5c2d068da23b25eff9aeb49c372bafc011104bcc35be) |
| Canonical liquidity deposit | [Arcscan transaction](https://testnet.arcscan.app/tx/0x6a0eb79e63afd3556a8a3079242e479938319b1a2f186d569132131d592e2c7d) |

The committed deployment manifest is [`contracts/deployments/arc-testnet.json`](contracts/deployments/arc-testnet.json). See [`docs/ARC_INTEGRATION.md`](docs/ARC_INTEGRATION.md) for the exact deployment and verification flow.

## Product thesis

Traders need liquid markets in which price represents an implied probability. LPs can supply that liquidity and receive fees without explicitly choosing the winning outcome. However, LP positions are not risk-free or perfectly market-neutral: informed order flow, probability shocks, resolution failures, and smart-contract risk can exceed earned fees.

```text
LP net return
= trading fees
- inventory repricing
- adverse selection
- oracle and operational losses
```

Probability is designed to make that complete equation visible rather than marketing gross fee APY as profit.

## Run the complete demo

Requirements: Docker Desktop with Docker Compose.

```bash
docker compose up --build
```

Then open:

- Web interface: <http://localhost:8080>
- API documentation: <http://localhost:8000/docs>
- API health: <http://localhost:8000/health>

Stop the stack with:

```bash
docker compose down
```

## Run without Docker

### Analytics and API

```bash
python -m pip install -e ".[api,dev]" pytest
python -m uvicorn api.main:app --reload
```

### Web application

```bash
npm --prefix web ci
npm --prefix web run dev
```

Set `VITE_API_URL=http://localhost:8000` in `web/.env` to use live API market data. If it is absent or unavailable, the UI intentionally falls back to deterministic demo data.

### Smart contracts

```bash
npm --prefix contracts ci
npm --prefix contracts test
npm --prefix contracts run compile
```

Arc deployment helpers use a dedicated ignored testnet key, deploy and seed one market, exercise a YES trade and liquidity deposit, and verify onchain invariants. See [contracts/README.md](contracts/README.md).

## Verify everything

```bash
./scripts/verify.sh
```

Windows PowerShell:

```powershell
./scripts/verify.ps1
```

The suite currently covers Python economics/API behavior, frontend logic and production build, and Solidity market/factory lifecycle tests.

## Repository map

| Path | Purpose |
|---|---|
| `web/` | Public React/Vite product demo |
| `api/` | Read-only FastAPI market, quote, and simulation service |
| `src/probability/` | AMM research model, LP accounting, and simulations |
| `contracts/` | Unaudited Hardhat smart contracts and tests |
| `docs/` | Product, architecture, economics, risk, security, and roadmap |
| `.github/workflows/` | Continuous integration and Pages deployment |

## Documentation

- [Product strategy and business model](docs/PRODUCT_STRATEGY.md)
- [Protocol overview](docs/PROTOCOL_OVERVIEW.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Economics](docs/ECONOMICS.md)
- [Risk model](docs/RISK_MODEL.md)
- [Security and compliance gates](docs/SECURITY_AND_COMPLIANCE.md)
- [API](docs/API.md)
- [Operations runbook](docs/RUNBOOK.md)
- [Roadmap](docs/ROADMAP.md)
- [Arc integration and deployment evidence](docs/ARC_INTEGRATION.md)
- [Hackathon submission copy](docs/HACKATHON_SUBMISSION.md)
- [Three-minute demo script](submission/DEMO_SCRIPT.md)
- [Release checklist](submission/RELEASE_CHECKLIST.md)

## Production boundary

The repository is suitable for demonstration, local integration, and public-testnet engineering. A real-value release still requires at minimum independent contract audits, economic review, invariant/fuzz testing, an accountable dispute-capable oracle, multisig and timelock controls, monitoring, an incident-response exercise, a bug bounty, and jurisdiction-specific legal approval.

The CFTC describes many event contracts as swaps or futures, and EU crypto rules do not displace existing financial-instrument law. Do not operate a public real-money market until counsel has defined permitted entities, markets, users, and jurisdictions.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md). Report suspected vulnerabilities privately according to [SECURITY.md](SECURITY.md); do not open a public issue for security-sensitive findings.

## License

MIT. See [LICENSE](LICENSE).
