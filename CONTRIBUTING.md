# Contributing to Probability

Thank you for helping improve Probability. The repository currently contains a
Python analytics/API package, a Vite web application, and experimental Solidity
contracts.

## Before you start

- Open an issue for substantial behavior, API, economic-model, or contract changes.
- Never include private keys, seed phrases, API tokens, or production market data.
- Treat all displayed yields as model outputs, not promises or financial advice.
- Treat the contracts as experimental until a release explicitly states that they
  have received an independent security audit.

## Local setup

Requirements:

- Python 3.10 or newer
- Node.js 22 or newer
- npm

Install the Python project and its test dependencies:

```bash
python -m pip install -e ".[api,dev]" pytest
```

Install JavaScript dependencies where those packages are present:

```bash
npm --prefix web install
npm --prefix contracts install
```

Run the complete local verification suite:

```bash
./scripts/verify.sh
```

On Windows PowerShell, use:

```powershell
./scripts/verify.ps1
```

To run the API in a container:

```bash
docker compose up --build
```

The API health endpoint is then available at `http://localhost:8000/health`.

## Pull requests

Keep pull requests focused and explain the user-visible behavior and risks. Add or
update tests for every behavior change. Changes to pricing, fees, settlement,
accounting, permissions, or smart contracts should also describe their invariants
and failure modes.

CI must pass for Python, web, and contract packages. Generated build output,
secrets, local environment files, and dependency directories must not be committed.

By contributing, you agree that your contribution is licensed under the repository's
MIT License.

