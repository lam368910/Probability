#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

echo "==> Python tests"
python -m pytest

if [[ -f web/package.json ]]; then
  echo "==> Web tests"
  npm --prefix web test --if-present
  echo "==> Web build"
  npm --prefix web run build --if-present
fi

if [[ -f contracts/package.json ]]; then
  echo "==> Contract compilation"
  npm --prefix contracts run compile --if-present
  echo "==> Contract tests"
  npm --prefix contracts test --if-present
fi

echo "==> Verification complete"

