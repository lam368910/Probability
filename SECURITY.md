# Security Policy

Probability is experimental software. The repository does not promise profit,
principal protection, uninterrupted availability, or suitability for production
funds. Unless a tagged release explicitly says otherwise, assume the smart contracts
are unaudited and deploy only to local or public test networks.

## Supported versions

Security fixes are applied to the latest commit on `main`. No production release is
currently supported.

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in a public issue, discussion,
pull request, or social channel. Use GitHub's private vulnerability reporting page:

<https://github.com/lam368910/Probability/security/advisories/new>

Include, where possible:

- the affected commit, component, and configuration;
- impact and realistic attack conditions;
- minimal reproduction steps or a proof of concept;
- suggested mitigations; and
- whether the issue has been disclosed anywhere else.

Do not access other people's data, degrade services, use mainnet funds, or perform
social engineering while researching. Stop testing once sensitive data or asset
loss becomes possible.

Maintainers should acknowledge a complete report within seven days, provide a
status update within fourteen days, and coordinate disclosure after a fix is
available. These are response targets, not a bug-bounty promise.

## Security-sensitive areas

Reports involving authorization, settlement, oracle manipulation, accounting,
reentrancy, price manipulation, denial of service, leaked secrets, or dependency
supply-chain compromise are especially valuable. General product feedback and
non-security bugs should use the public issue tracker.
