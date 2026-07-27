# Probability

**Probability** is prediction-market liquidity infrastructure for traders and liquidity providers. It combines a public demo interface, AMM and LP smart-contract prototypes, a reproducible risk engine, and a read-only analytics API.

**Public demo:** <https://lam368910.github.io/Probability/>

> **Current status: public demo and testnet engineering release.** The contracts are unaudited. No component in this repository promises profit, protects principal, or is approved to custody real funds.

## What works today

- Responsive React market, portfolio, and simulation interface
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

Deployment helpers require explicit environment variables and are testnet-only. They do not contain private keys or automatically seed a market. See [contracts/README.md](contracts/README.md).

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

## Production boundary

The repository is suitable for demonstration, local integration, and public-testnet engineering. A real-value release still requires at minimum independent contract audits, economic review, invariant/fuzz testing, an accountable dispute-capable oracle, multisig and timelock controls, monitoring, an incident-response exercise, a bug bounty, and jurisdiction-specific legal approval.

The CFTC describes many event contracts as swaps or futures, and EU crypto rules do not displace existing financial-instrument law. Do not operate a public real-money market until counsel has defined permitted entities, markets, users, and jurisdictions.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md). Report suspected vulnerabilities privately according to [SECURITY.md](SECURITY.md); do not open a public issue for security-sensitive findings.

## License

MIT. See [LICENSE](LICENSE).
