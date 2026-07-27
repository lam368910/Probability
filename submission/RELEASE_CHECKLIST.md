# Hackathon Release Checklist

Owner names and links should be added in the organizer portal or private team tracker,
not invented in this repository. Complete this checklist from top to bottom.

## 0. Application gate — blocking

- [ ] Confirm the organizer application was submitted under the correct team account.
- [ ] Confirm the project exists in the organizer portal.
- [ ] Add every eligible team member and verify their displayed details.
- [ ] Share the project idea for the extended checkpoint by **midnight Sunday,
  August 2, 2026**. Source: user-provided organizer extension note. The note does not
  specify a timezone; confirm it in the portal or with the organizer.
- [ ] Complete registration by **Saturday, August 8, 2026**. Source: organizer
  registration schedule supplied to the team; confirm the portal cutoff time.
- [ ] Save private proof of application/registration and a confirmation timestamp.

**Stop:** if these items are not complete, escalate to the organizer immediately.
A deployed app, repository, or video cannot repair a missing application after the
portal closes.

## 1. Repository freeze

- [x] Confirm the public repository is `https://github.com/lam368910/Probability`.
- [x] Remove secrets, private keys, wallet exports, local environment files, and
  accidental personal data from the working tree and Git history.
- [ ] Confirm all license and third-party asset attributions are present.
- [ ] Run `./scripts/verify.sh` or `./scripts/verify.ps1` from a clean checkout.
- [ ] Confirm Python, API, web, and contract tests pass.
- [ ] Confirm the production web build succeeds.
- [ ] Record the release commit: `<RELEASE_COMMIT_SHA>`.
- [ ] Tag the tested commit only after every required fix has landed.

## 2. Arc Testnet deployment

- [ ] Use a dedicated testnet-only deployer; never use a mainnet wallet.
- [x] Confirm Arc Testnet chain ID `5042002` before signing.
- [x] Confirm the wallet chain ID is encoded as `0x4CEF52` and the configured RPC is
  the current official endpoint, `https://rpc.testnet.arc.io`.
- [x] Confirm USDC address `0x3600000000000000000000000000000000000000`
  against current official Arc documentation.
- [x] Fund the deployer with enough testnet USDC for gas and the seed.
- [ ] Review the question, close time, oracle, owner, treasury, fees, protocol share,
  minimum reserve, and seed amount with a second team member.
- [x] Ensure `CLOSE_TIME` is in the future and the resolution condition is objective.
- [x] Run `npm --prefix contracts run deploy:arc`.
- [x] Run `npm --prefix contracts run smoke:arc`.
- [x] Verify all addresses and transactions independently on Arcscan.
- [x] Record factory: `0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601`.
- [x] Record market: `0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42`.
- [x] Record factory deployment transaction: `0x27501f61c889a4f98e21208834457e9fdd4c7bf1483a100f6f8296cb2843a84c`.
- [x] Record market creation transaction: `0x7f1685179ab220d7c54c45667aa2422b1feba090573b9bf4f9d38f887799bb4f`.
- [x] Record initialization transaction: `0x9cd2f1072da7a5c75b529c9718118352713dbe85278aaf5e5cf8ffce6218e3d2`.

## 3. Web and demo deployment

- [x] Build the public factory address `0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601` into the frontend.
- [x] Build the public market address `0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42` into the frontend.
- [ ] Set the public API URL for the web deployment.
- [ ] Rebuild after setting environment values; do not rely on local development env.
- [ ] Test in a signed-out/private browser window on desktop and mobile widths.
- [ ] Connect a wallet and confirm Arc Testnet switching.
- [ ] Confirm testnet USDC balance and market state load from chain.
- [x] Complete one minimal YES purchase and one minimal liquidity deposit onchain.
- [x] Confirm the UI targets and links to the correct Arcscan market address.
- [ ] Confirm there are no mainnet claims, real-money prompts, guaranteed returns, or
  unresolved placeholders visible in the application.
- [x] Record live demo URL: `https://lam368910.github.io/Probability/`.
- [x] Record canonical demo transaction: `https://testnet.arcscan.app/tx/0x72c9c287ff2bea33379f5c2d068da23b25eff9aeb49c372bafc011104bcc35be`.

## 4. Judge assets

- [ ] Record a complete live run before recording the final video.
- [ ] Keep the final pitch/demo at or below the organizer's three-minute limit.
- [ ] Show wallet connection, chain identity, public contract evidence, one completed
  Arc transaction, changed state, and the risk disclosure.
- [ ] Use readable zoom, captions, and clean audio; remove wallet notifications that
  reveal unrelated accounts.
- [ ] Do not show private keys, seed phrases, API credentials, private browser tabs,
  or testnet-wallet export screens.
- [ ] Upload with public or unlisted judge access and test the link while signed out.
- [x] Record video URL: `https://lam368910.github.io/Probability/Probability-Arc-Demo.mp4`.
- [x] Export the pitch deck and verify fonts, links, page order, and slide bounds.
- [x] Record deck URL: `https://lam368910.github.io/Probability/Probability-Arc-Pitch.pptx`.
- [ ] Replace every placeholder in `docs/HACKATHON_SUBMISSION.md`.

## 5. Final submission

- [ ] Re-read the live organizer form; form fields override this internal checklist.
- [ ] Submit a functional frontend/backend, three-minute video, and repository link.
- [ ] Include Arc contract and transaction explorer links where the form permits.
- [ ] Check every link in a signed-out browser and on a second network/device.
- [ ] Submit before **Sunday, August 9, 2026, AoE**. Source: organizer final-submission
  schedule supplied to the team. Keep the AoE label and use the live portal countdown
  rather than inventing a local conversion.
- [ ] Save the final form content, confirmation page, and submission timestamp.
- [ ] Do not make risky deployments or breaking UI changes after submission.

## 6. Demo Day readiness

- [ ] Prepare for **Thursday, August 20, 2026**. Source: organizer program schedule
  supplied to the team; confirm the event time separately.
- [ ] Maintain a prerecorded fallback and local demo build.
- [ ] Keep the testnet deployer funded for demo gas without exposing its private key.
- [ ] Re-run the smoke check and canonical user flow before the session.
- [ ] Prepare concise answers on LP loss, adverse selection, oracle design, contract
  controls, model differences, compliance, and path to audit.
- [ ] State clearly that the prototype is Arc Testnet-only and unaudited.

## Release sign-off

| Check | Value |
| --- | --- |
| Application confirmed | `<YES / NO>` |
| Release commit | `<RELEASE_COMMIT_SHA>` |
| Arc factory verified | `YES` |
| Arc market verified | `YES` |
| Smoke test passed | `YES` |
| Live demo checked signed out | `<YES / NO>` |
| Video checked signed out | `<YES / NO>` |
| Submission confirmation saved | `<YES / NO>` |
