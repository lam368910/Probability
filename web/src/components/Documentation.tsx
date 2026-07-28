import { ARC_DEPLOYMENT, ARC_TESTNET } from '../config/arc'
import { Icon } from './Icon'

const REPOSITORY = 'https://github.com/lam368910/Probability'
const DOCS_BASE = `${REPOSITORY}/blob/main/docs`

const guides = [
  {
    index: '01',
    label: 'FOUNDATION',
    title: 'Protocol & economics',
    description: 'Market lifecycle, participant roles, AMM design, fee flows, and the return and risk model for liquidity providers.',
    href: `${DOCS_BASE}/PROTOCOL_OVERVIEW.md`,
    secondary: `${DOCS_BASE}/ECONOMICS.md`,
    secondaryLabel: 'Economics',
  },
  {
    index: '02',
    label: 'SOLIDITY',
    title: 'Smart contracts',
    description: 'Binary market and factory contracts, settlement rules, fee accounting, pause controls, and tested protocol invariants.',
    href: `${REPOSITORY}/tree/main/contracts`,
  },
  {
    index: '03',
    label: 'NETWORK',
    title: 'Arc integration',
    description: 'Network configuration, wallet transaction paths, deployment procedure, verified addresses, and public onchain evidence.',
    href: `${DOCS_BASE}/ARC_INTEGRATION.md`,
  },
  {
    index: '04',
    label: 'DATA',
    title: 'Market data',
    description: 'Read-only Polymarket discovery and CLOB history, eligibility filters, caching behavior, provenance, and fallbacks.',
    href: `${DOCS_BASE}/MARKET_DATA.md`,
  },
  {
    index: '05',
    label: 'RESEARCH',
    title: 'Analytics API',
    description: 'FastAPI endpoints for health, market discovery, deterministic quotes, and LP scenario simulation.',
    href: `${DOCS_BASE}/API.md`,
  },
  {
    index: '06',
    label: 'ASSURANCE',
    title: 'Security & operations',
    description: 'The unaudited testnet boundary, threat model, production readiness gates, and the operator runbook.',
    href: `${DOCS_BASE}/SECURITY_AND_COMPLIANCE.md`,
    secondary: `${DOCS_BASE}/RUNBOOK.md`,
    secondaryLabel: 'Runbook',
  },
] as const

const compactAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`

export function Documentation() {
  return (
    <section className="docs-section" id="docs" data-reveal>
      <header className="docs-heading">
        <div>
          <span className="section-index">04</span>
          <p className="eyebrow-text">PROJECT DOCUMENTATION</p>
          <h2>Built in public.<br /><em>Documented for scrutiny.</em></h2>
        </div>
        <p>Everything needed to understand, run, inspect, and evaluate Probability—from the liquidity model to its Arc Testnet deployment.</p>
      </header>

      <div className="docs-overview">
        <aside className="docs-release">
          <div className="docs-release-head">
            <span>CURRENT RELEASE</span>
            <b><i /> TESTNET MVP</b>
          </div>
          <h3>What is live today</h3>
          <ul>
            <li><span>01</span>Arc wallet connection and network switching</li>
            <li><span>02</span>Onchain YES buys and LP deposits</li>
            <li><span>03</span>Read-only live market discovery and charts</li>
            <li><span>04</span>Deterministic research and scenario API</li>
          </ul>
          <div className="docs-boundary">
            <Icon name="shield" />
            <p><strong>Unaudited testnet software</strong>Test USDC has no value. The interface does not custody user funds or promise returns.</p>
          </div>
          <a href={REPOSITORY} target="_blank" rel="noreferrer">Open repository <Icon name="arrow" /></a>
        </aside>

        <div className="docs-grid">
          {guides.map((guide) => (
            <article className="doc-card" key={guide.index}>
              <div className="doc-card-meta"><span>{guide.index}</span><b>{guide.label}</b></div>
              <h3>{guide.title}</h3>
              <p>{guide.description}</p>
              <div className="doc-card-links">
                <a href={guide.href} target="_blank" rel="noreferrer">Read guide <Icon name="arrow" /></a>
                {'secondary' in guide && <a href={guide.secondary} target="_blank" rel="noreferrer">{guide.secondaryLabel}</a>}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="docs-utility">
        <div className="docs-quickstart">
          <div><span>QUICK START</span><b>LOCAL INTERFACE</b></div>
          <pre><code><span>$</span> git clone https://github.com/lam368910/Probability.git{`\n`}<span>$</span> npm --prefix web ci{`\n`}<span>$</span> npm --prefix web run dev</code></pre>
          <p>Run the complete verification suite with <code>./scripts/verify.ps1</code> on Windows or <code>./scripts/verify.sh</code> on macOS and Linux.</p>
        </div>

        <div className="docs-evidence">
          <div className="docs-evidence-head">
            <span>DEPLOYMENT EVIDENCE</span>
            <b><i /> PUBLIC</b>
          </div>
          <dl>
            <div><dt>Network</dt><dd>{ARC_TESTNET.name}</dd></div>
            <div><dt>Chain ID</dt><dd>{ARC_TESTNET.chainId}</dd></div>
            <div><dt>Factory</dt><dd><a href={`${ARC_TESTNET.explorerUrl}/address/${ARC_DEPLOYMENT.factory}`} target="_blank" rel="noreferrer">{compactAddress(ARC_DEPLOYMENT.factory)} <Icon name="arrow" /></a></dd></div>
            <div><dt>Market</dt><dd><a href={`${ARC_TESTNET.explorerUrl}/address/${ARC_DEPLOYMENT.market}`} target="_blank" rel="noreferrer">{compactAddress(ARC_DEPLOYMENT.market)} <Icon name="arrow" /></a></dd></div>
          </dl>
          <a className="docs-evidence-link" href={`${DOCS_BASE}/HACKATHON_SUBMISSION.md`} target="_blank" rel="noreferrer">View submission dossier <Icon name="arrow" /></a>
        </div>
      </div>
    </section>
  )
}
