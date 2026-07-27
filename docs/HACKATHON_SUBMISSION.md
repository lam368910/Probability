# Probability — Arc Programmable Money Hackathon Submission

## Submission status

**Application-first blocker:** before any final submission can be valid, the team
must confirm that its organizer application is submitted, the project has been
created in the portal, the team is attached, and the idea checkpoint is complete.
Building or deploying the prototype does not complete that step.

| Milestone | Deadline | Source and handling |
| --- | --- | --- |
| Project checkpoint: create project, add team, share idea | **Midnight, Sunday, August 2, 2026** | User-provided organizer note says the checkpoint was extended. The note does not state a timezone; none is inferred here. |
| Registration closes | **Saturday, August 8, 2026** | Organizer registration schedule supplied to the team. No cutoff time is inferred. |
| Final submission | **Sunday, August 9, 2026, AoE** | Organizer final-submission schedule supplied to the team. Preserve the organizer's AoE label in planning and confirm the portal countdown before submitting. |
| Demo Day | **Thursday, August 20, 2026** | Organizer program schedule supplied to the team. No event time is inferred. |

The public [Arc House event page](https://community.arc.io/public/events/hackathon-programmable-money-74llz8htis)
lists the wider online program as July 13–August 22, 2026 and specifies a working
prototype on Arc, a functional frontend and backend, a three-minute pitch/demo, and
a code-repository link. The milestone dates above are the more specific organizer
schedule supplied to the team.

## Project summary

Probability is a DeFi liquidity protocol for prediction markets. Instead of requiring
every participant to choose an event outcome, it lets liquidity providers supply
testnet USDC to a binary market and earn a share of trading fees while traders buy
outcome exposure.

The central product thesis is that prediction-market activity can become a new DeFi
fee source. The product is explicit that liquidity provision is not risk-free:
informed order flow, probability shocks, oracle decisions, and low volume can all
make fees insufficient to offset losses.

## Problem

Prediction markets need liquidity, but passive capital lacks clear tools for
understanding fee yield, adverse selection, and event-resolution risk. Existing user
experiences also tend to frame every action as a directional bet.

## Solution

Probability combines:

- an Arc-native binary market collateralized and paid for with testnet USDC;
- factory-managed market creation and explicit owner, oracle, pause, and fee roles;
- a wallet-connected frontend for onchain state, YES purchases, and liquidity;
- a read-only analytics API for fee, inventory, and stress-simulation education; and
- transparent disclosures that separate modeled APR from realized returns.

## Why Arc

Arc is a strong fit because USDC is both the gas token and the market collateral.
Users do not need a volatile secondary token to interact with a dollar-denominated
market. Arc's deterministic sub-second finality also makes the approve-and-transact
demo legible: the UI can refresh final market state immediately after confirmation.

Probability currently uses standard EVM wallet and Solidity tooling on Arc. The
testnet deployment flow verifies chain ID `5042002`, uses Arc Testnet USDC at
`0x3600000000000000000000000000000000000000`, deploys the factory, creates a market,
and seeds its reserves. Arc network details are documented in
[ARC_INTEGRATION.md](ARC_INTEGRATION.md).

## Working prototype walkthrough

1. Open [the live demo](https://lam368910.github.io/Probability/).
2. Show the Arc Testnet status panel and connect an EVM wallet.
3. Confirm chain `5042002` and the testnet USDC balance.
4. Open [the Arc market](https://testnet.arcscan.app/address/0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42) and show its address and state.
5. Select the live market and enter a small testnet USDC amount.
6. Buy YES; show the approval, the final transaction, and changed reserves.
7. Add a small amount of liquidity; show the transaction and updated position.
8. Use the risk simulator to explain why fee APR is a scenario, not a promise.
9. Close on the repository, automated tests, and the production-path limitations.

## Three-minute video outline

| Time | Content |
| --- | --- |
| 0:00–0:25 | Problem, target users, and the non-directional liquidity thesis |
| 0:25–0:50 | Why Arc: native USDC gas/collateral and fast deterministic finality |
| 0:50–1:50 | Live wallet connection, Arcscan contract, YES purchase, and liquidity deposit |
| 1:50–2:25 | Analytics and adverse-selection risk scenario |
| 2:25–2:45 | Contract architecture, tests, and public transaction evidence |
| 2:45–3:00 | Honest limitations and next production milestones |

## Judge links

| Artifact | Link |
| --- | --- |
| Source repository | https://github.com/lam368910/Probability |
| Live demo | https://lam368910.github.io/Probability/ |
| Three-minute video | https://lam368910.github.io/Probability/Probability-Arc-Demo.mp4 |
| Pitch deck | https://lam368910.github.io/Probability/Probability-Arc-Pitch.pptx |
| Arc factory | https://testnet.arcscan.app/address/0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601 |
| Arc market | https://testnet.arcscan.app/address/0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42 |
| YES trade | https://testnet.arcscan.app/tx/0x72c9c287ff2bea33379f5c2d068da23b25eff9aeb49c372bafc011104bcc35be |
| Liquidity deposit | https://testnet.arcscan.app/tx/0x6a0eb79e63afd3556a8a3079242e479938319b1a2f186d569132131d592e2c7d |

Each link must be opened in a signed-out browser before the organizer form is submitted.

## What is built versus what comes next

Built for the hackathon: tested market/factory contracts, Arc deployment and smoke
scripts, wallet network switching, testnet USDC approvals and transactions, explorer
links, responsive frontend, analytics API, simulations, documentation, and CI.

Next production steps: independent contract audit, decentralized or dispute-backed
resolution, indexed market history, role separation and multisig controls, deeper LP
risk limits, legal review by target jurisdiction, incident response, and monitored
deployment infrastructure.

## Safety statement

The submission is an unaudited Arc Testnet prototype. Testnet USDC has no value.
Probability does not guarantee yield or principal, and no material should invite
users to deposit real funds.
