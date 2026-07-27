# Operations Runbook

## Local release check

1. Install Python and Node dependencies.
2. Run `scripts/verify.ps1` on Windows or `scripts/verify.sh` on macOS/Linux.
3. Run `docker compose build`.
4. Run `docker compose up -d`.
5. Verify `http://localhost:8000/health`, `http://localhost:8000/docs`, and `http://localhost:8080/healthz`.
6. Open the web application and test market selection, LP simulation, trade simulation, and mobile layout.
7. Run `docker compose down`.

## Public demo release

The `pages.yml` workflow builds only the static demo interface. It includes no secrets, wallet signer, production contract address, or real balance data.

Before publishing:

- confirm the testnet/unaudited ribbon is visible;
- confirm every balance and APY is labelled as demo or estimated;
- verify the GitHub link and risk disclosure;
- check the production bundle and browser console;
- inspect the deployed page at desktop and mobile widths.

## Testnet contract release

1. Choose one supported chain and standard non-rebasing test collateral.
2. Define market wording, close time, primary source, invalid conditions, oracle, owner, fee, and minimum reserve.
3. Use separate hardware-backed accounts or a test multisig for owner and oracle roles.
4. Deploy and verify the factory, then create a market through it.
5. Publish chain ID, compiler settings, source, addresses, transaction hashes, roles, and parameters.
6. Seed only test collateral.
7. Exercise buy, sell, add/remove liquidity, pause, normal resolution, invalid resolution, and redemption.
8. Reconcile contract collateral against `requiredCollateral()` after every lifecycle stage.

## Incident priorities

1. Preserve exits when safe; pausing should block new risk, not user redemption.
2. Record the affected chain, addresses, block, transaction, balances, and roles.
3. Notify multisig signers and security contacts through a pre-agreed channel.
4. Do not change the oracle or resolve a disputed market without a public evidence trail.
5. Publish a concise status update without speculating about loss or recovery.
6. Preserve logs and fork state for reproduction.

## Mainnet prohibition

Do not deploy real-value markets from this repository until every mainnet gate in [Security and compliance](SECURITY_AND_COMPLIANCE.md) has documented evidence and explicit sign-off.

