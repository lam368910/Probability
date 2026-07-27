$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    Write-Host "==> Python tests"
    python -m pytest
    if ($LASTEXITCODE -ne 0) { throw "Python tests failed." }

    if (Test-Path "web/package.json") {
        Write-Host "==> Web tests"
        npm --prefix web test --if-present
        if ($LASTEXITCODE -ne 0) { throw "Web tests failed." }

        Write-Host "==> Web build"
        npm --prefix web run build --if-present
        if ($LASTEXITCODE -ne 0) { throw "Web build failed." }
    }

    if (Test-Path "contracts/package.json") {
        Write-Host "==> Contract compilation"
        npm --prefix contracts run compile --if-present
        if ($LASTEXITCODE -ne 0) { throw "Contract compilation failed." }

        Write-Host "==> Contract tests"
        npm --prefix contracts test --if-present
        if ($LASTEXITCODE -ne 0) { throw "Contract tests failed." }
    }

    Write-Host "==> Verification complete"
}
finally {
    Pop-Location
}

