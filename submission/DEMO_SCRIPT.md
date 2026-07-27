# Probability — 3-minute Arc MVP demo

Target length: 2:45–2:55. Record in 1080p, keep the wallet and Arcscan tabs open,
and use only small amounts of testnet USDC.

## 0:00–0:20 — The problem

**Screen:** Probability hero, then scroll to the safety sentence below it.

**Narration:**

> Prediction markets turn beliefs into prices, but most users can only participate
> by betting on an outcome. Probability opens a second role: provide liquidity to
> both sides of a market and earn a share of trading fees. It is market-neutral in
> intent, not risk-free — inventory moves, informed order flow, and oracle failure
> can still outweigh fees.

## 0:20–0:45 — The product

**Screen:** Scroll through market cards and select a market. Open Position Lab.

**Narration:**

> The interface separates analytics from execution. Market cards, fee APR, and the
> portfolio are clearly labelled demo data. Position Lab makes the full LP equation
> visible: gross fees minus a range-risk estimate. We never present gross fee yield
> as guaranteed profit.

## 0:45–1:15 — Why Arc

**Screen:** Stop at the Arc Testnet MVP panel. Show network, deployment addresses,
and connected wallet.

**Narration:**

> The executable MVP is deployed on Arc Testnet, chain 5,042,002. Arc is a natural
> settlement layer because USDC is both the native gas asset and the market
> collateral, while its ERC-20 interface gives contracts standard approvals and
> transfer-from semantics. Deterministic sub-second finality keeps the trading flow
> responsive.

## 1:15–1:55 — Live YES trade

**Screen:** Choose Trade outcome, enter `0.10` USDC, click Buy YES on Arc, approve
USDC if needed, confirm the trade, then open the transaction on Arcscan.

**Narration:**

> Here is a real testnet transaction, not a simulated button. The client reads the
> onchain quote, adds a one-percent minimum-output guard, approves the official Arc
> USDC interface, and submits the buy. After one confirmed receipt, the app refreshes
> the reserves and links directly to Arcscan.

**Evidence to show:** <https://testnet.arcscan.app/tx/0x72c9c287ff2bea33379f5c2d068da23b25eff9aeb49c372bafc011104bcc35be>

## 1:55–2:25 — Live liquidity deposit

**Screen:** Return to Position Lab, choose Provide liquidity, enter `0.10` USDC,
submit, then show updated reserves and the Arcscan receipt.

**Narration:**

> Now I add liquidity to both outcome reserves. Trading fees are split eighty percent
> to LP accounting and twenty percent to the protocol treasury in this demo market.
> The contracts enforce a reserve floor, deadlines, pause controls, solvency checks,
> and two-step ownership. They are unaudited and intentionally remain testnet-only.

**Evidence to show:** <https://testnet.arcscan.app/tx/0x6a0eb79e63afd3556a8a3079242e479938319b1a2f186d569132131d592e2c7d>

## 2:25–2:50 — Architecture and close

**Screen:** Show the mechanism section, then the GitHub repository and factory/market
pages on Arcscan.

**Narration:**

> Probability combines a fixed-product binary AMM, a factory and market registry,
> a React wallet experience, and a separate risk engine for adverse-selection stress
> tests. The next milestones are an accountable dispute-capable oracle, invariant and
> fuzz testing, independent audits, and a limited pilot. The code, live demo, deck,
> and all onchain evidence are public. Probability turns market activity into
> transparent, risk-aware USDC fee yield on Arc.

## Recording checklist

- Application is submitted before recording is treated as final evidence.
- Browser zoom is 100%; notifications, bookmarks, and personal wallet history are hidden.
- No private key, seed phrase, local env file, email, or personal account identifier appears.
- Wallet shows Arc Testnet and only testnet USDC.
- Factory, market, buy, and liquidity URLs resolve publicly in a signed-out browser.
- Captions use “illustrative”, “testnet”, and “unaudited”; never “guaranteed yield”.
- Final MP4 is under three minutes and its share setting is “anyone with the link”.
