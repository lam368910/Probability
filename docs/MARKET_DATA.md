# Market data sources

The public web app uses two strictly separated market-data paths.

## External discovery

When no custom `VITE_API_URL` is configured, the browser reads active events from the public Polymarket Gamma API and fetches one week of YES-token price history from the public CLOB API. The adapter keeps only active binary markets with an order book, open orders, at least $1,000 of 24-hour volume, at least $10,000 of liquidity, and a probability between 3% and 97%.

The interface displays the source, latest update time, external market link, current YES price, 24-hour change, volume, liquidity, and a downsampled seven-day chart. Results are cached in the browser for 60 seconds and simultaneous requests are deduplicated.

This path is read-only. It does not place Polymarket orders, provide Polymarket liquidity, resolve Probability markets, or imply that the displayed external market exists on Arc. External fee yield is intentionally shown as unavailable because it is not derived by Probability.

## Probability and demo data

A configured `VITE_API_URL` takes precedence and supplies Probability API markets. If the external public feed is unreachable, malformed, or provides fewer than four eligible markets with price history, the app switches to deterministic sample markets and labels the fallback in the interface. The Arc transaction controls remain bound only to the configured Arc Testnet contract shown in the onchain target panel.

## Public endpoints

- Gamma events: `https://gamma-api.polymarket.com/events`
- CLOB price history: `https://clob.polymarket.com/prices-history`

No API key is stored in the client for these public reads.
