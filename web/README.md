# Probability Web

Public testnet interface for the Probability prediction-market liquidity protocol.

## Run locally

```bash
npm install
npm run dev
```

The interface uses local demo data by default. To read markets from the protocol API, copy `.env.example` to `.env` and set `VITE_API_URL`. Failed API requests fall back to demo data so the public prototype remains usable.

## Quality checks

```bash
npm test
npm run build
```

The simulator is illustrative and does not submit blockchain transactions. The product is unaudited and must not accept real deposits in its current form.
