# Arc Integration

This document describes the verified Arc Testnet deployment that backs the
Probability hackathon MVP. Addresses and transaction hashes below are public
testnet evidence; testnet USDC has no monetary value.

## Integration status

| Area | Status | Evidence |
| --- | --- | --- |
| Arc network configuration | Verified | Hardhat and web clients target Arc Testnet chain ID `5042002` |
| Factory and binary market contracts | Implemented and locally tested | Contract compilation and test suite |
| Arc deployment automation | Implemented | `npm run deploy:arc` deploys a factory, creates one market, and seeds it |
| Arc post-deployment check | Implemented | `npm run smoke:arc` checks registration, initialization, reserves, and collateral |
| Wallet network switching | Implemented | Web client requests Arc Testnet and displays the connected account |
| Testnet USDC interactions | Verified onchain | Balance read, approval, YES purchase, and liquidity deposit |
| Public Arc deployment | **Live** | Factory, market, seed, trade, liquidity, and smoke evidence below |

The Python API is a read-only analytics service. Its LMSR quotes are research
outputs and are not quotes from the Solidity fixed-product market. Wallet
transactions use contract state as the source of truth.

## Arc Testnet configuration

| Field | Value |
| --- | --- |
| Network | Arc Testnet |
| Chain ID | `5042002` (`0x4CEF52`) |
| RPC | `https://rpc.testnet.arc.io` |
| Explorer | `https://testnet.arcscan.app` |
| Native gas token | USDC, 18-decimal native precision |
| Testnet USDC ERC-20 interface | `0x3600000000000000000000000000000000000000` |
| USDC ERC-20 decimals | `6` |
| Faucet | `https://faucet.circle.com` |

Sources: [Connect to Arc](https://docs.arc.io/arc/references/connect-to-arc),
[Arc contract addresses](https://docs.arc.io/arc/references/contract-addresses),
[Arc documentation index](https://docs.arc.io/llms.txt), and the
[Arc Testnet explorer](https://testnet.arcscan.app). Arc documentation states that
Arc is currently testnet-only, USDC is the native gas token, and transactions have
sub-second deterministic finality.

The native gas balance and the ERC-20 interface share the underlying USDC balance,
but use different precision. Contract collateral operations use the 6-decimal ERC-20
interface; gas accounting uses 18-decimal native precision. The values must not be
mixed directly.

Testnet USDC has no monetary value. This prototype is unaudited and must not be
represented as a production investment product.

## Transaction path

1. The wallet switches to Arc Testnet.
2. The client reads the user's testnet USDC balance and onchain market state.
3. For a YES purchase, the client obtains an onchain quote, approves USDC, applies a
   1% minimum-output guard, and submits `buy`.
4. For liquidity, the client approves USDC and submits `addLiquidity`.
5. The UI waits for one confirmed receipt, refreshes state, and links the transaction
   on Arcscan.

The deployed market holds collateral and outcome-token accounting. The factory
records markets and protocol-fee configuration. The web client is not trusted for
pricing, settlement, or authorization.

## Deployment procedure

### 0. Clear the application blocker

Before treating deployment work as a valid hackathon submission, confirm that the
team application exists in the organizer portal, the project has been created, all
team members have been added, and the idea has been shared. A repository or testnet
deployment does **not** replace the organizer application.

### 1. Verify locally

```bash
npm --prefix contracts install
npm --prefix contracts run compile
npm --prefix contracts test
```

### 2. Prepare a testnet-only deployer

Generate a new isolated Arc testnet wallet if required:

```bash
npm --prefix contracts run wallet:arc
```

This creates `contracts/.env.arc.local`, which is ignored by Git. Never reuse a
mainnet wallet or copy the private key into documentation, chat, screenshots, video,
CI, or the submission portal.

Fund the deployer with Arc Testnet USDC from the Circle faucet. USDC is needed both
for Arc gas and for the initial market collateral.

### 3. Configure deployment inputs

Review `contracts/.env.arc.local` and set only the required values:

```dotenv
ARC_PRIVATE_KEY=<TESTNET_ONLY_PRIVATE_KEY>
ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.io
FACTORY_OWNER=<OWNER_ADDRESS>
PROTOCOL_TREASURY=<TREASURY_ADDRESS>
ORACLE_ADDRESS=<ORACLE_ADDRESS>
OWNER_ADDRESS=<MARKET_OWNER_ADDRESS>
MARKET_QUESTION=<UNAMBIGUOUS_RESOLUTION_QUESTION>
CLOSE_TIME=<FUTURE_UNIX_TIMESTAMP>
FEE_BPS=30
PROTOCOL_FEE_SHARE_BPS=2000
MINIMUM_RESERVE=1000000
SEED_AMOUNT=5000000
```

The sample seed is 5 testnet USDC and the sample minimum reserve is 1 testnet USDC.
The deployer, owner, oracle, and treasury may be the same testnet address for the
demo, but that concentration must be disclosed and is not a production control
model.

### 4. Deploy and capture public evidence

```bash
npm --prefix contracts run deploy:arc
npm --prefix contracts run smoke:arc
```

The deployment script writes `contracts/deployments/arc-testnet.json`. Review the
chain ID and every address against Arcscan before copying them into any public
artifact.

### 5. Connect the frontend

Set the deployed addresses in the web build environment:

```dotenv
VITE_ARC_FACTORY_ADDRESS=<ARC_FACTORY_ADDRESS>
VITE_ARC_MARKET_ADDRESS=<ARC_MARKET_ADDRESS>
```

Build the web client again, connect a testnet wallet, and demonstrate a small YES
purchase and a small liquidity deposit. Confirm that both explorer links resolve to
successful transactions and that refreshed reserves match contract state.

## Release evidence

| Artifact | Release value |
| --- | --- |
| Factory | [`0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601`](https://testnet.arcscan.app/address/0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601) |
| Market | [`0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42`](https://testnet.arcscan.app/address/0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42) |
| Factory deployment transaction | [`0x2750…a84c`](https://testnet.arcscan.app/tx/0x27501f61c889a4f98e21208834457e9fdd4c7bf1483a100f6f8296cb2843a84c) |
| Market creation transaction | [`0x7f16…bb4f`](https://testnet.arcscan.app/tx/0x7f1685179ab220d7c54c45667aa2422b1feba090573b9bf4f9d38f887799bb4f) |
| Market initialization transaction | [`0x9cd2…e3d2`](https://testnet.arcscan.app/tx/0x9cd2f1072da7a5c75b529c9718118352713dbe85278aaf5e5cf8ffce6218e3d2) |
| Demonstrated YES purchase | [`0x72c9…35be`](https://testnet.arcscan.app/tx/0x72c9c287ff2bea33379f5c2d068da23b25eff9aeb49c372bafc011104bcc35be) |
| Demonstrated liquidity deposit | [`0x6a0e…2c7d`](https://testnet.arcscan.app/tx/0x6a0eb79e63afd3556a8a3079242e479938319b1a2f186d569132131d592e2c7d) |
| Live application | [lam368910.github.io/Probability](https://lam368910.github.io/Probability/) |

## Known testnet limitations

- The contracts are unaudited and use centralized owner, oracle, pause, and treasury
  roles for the hackathon deployment.
- The initial market uses a single resolution authority and has no dispute window.
- The client currently supports YES purchases and liquidity deposits for one staged
  market; it is not a complete trading terminal.
- The API and Solidity contracts intentionally use different AMM models and must not
  be presented as interchangeable quote engines.
- There is no mainnet deployment, real-value collateral, guaranteed yield, or claim
  of production readiness.
