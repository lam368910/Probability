# Analytics API

The FastAPI service is intentionally read-only. It can quote and simulate, but it cannot custody collateral, submit wallet transactions, or resolve a market.

## Start

```bash
python -m pip install -e ".[api,dev]"
python -m uvicorn api.main:app --reload
```

Interactive OpenAPI documentation is available at <http://localhost:8000/docs>.

## Endpoints

### `GET /health`

Returns service status, version, and the explicit `demo` mode.

### `GET /v1/markets`

Returns deterministic public-demo markets with question, category, implied YES probability, liquidity, volume, fee, close time, source, and status.

### `GET /v1/markets/{market_id}`

Returns one demo market or `404`.

### `POST /v1/quote`

Quotes a binary LMSR research-model purchase from caller-supplied state without mutating server state. These quotes are not Solidity fixed-product AMM quotes.

Example:

```json
{
  "outcome": "YES",
  "shares": 25,
  "liquidity": 100,
  "fee_bps": 100,
  "yes_shares": 0,
  "no_shares": 0
}
```

The response separates gross cost, fee, total cost, average price, before/after price, and price impact.

### `POST /v1/simulations/lp`

Runs a bounded, seeded LP scenario. `preset` may be `custom`, `calm`, or `news_shock`. The response separates gross cash, fees, liability, net P&L, ending equity, annualized metrics, informed volume, and `gross_mtm_trading_loss`. The latter is a gross mark-to-market loss metric, not causal attribution to informed traders.

Simulation output is synthetic. It is not a forecast, backtest of an investable strategy, or promise of returns.

## CORS

Allowed origins are read from a comma-separated environment variable:

```text
PROBABILITY_CORS_ORIGINS=http://localhost:5173,http://localhost:8080
```

Do not use a wildcard origin for a production deployment.

## Production work still required

- Authentication and authorization for non-public endpoints
- Per-client rate limits and request budgets
- Durable indexed on-chain data instead of demo records
- Multiple RPC providers and confirmation/finality policy
- Metrics, tracing, structured logs, and alerting
- Cache and load testing
- Signed deployment metadata and contract-address allowlists
