import { Icon } from './Icon'

export function Header() {
  return (
    <>
      <div className="testnet-ribbon" role="status">
        <span>ARC TESTNET</span>
        <p>Unaudited MVP · Testnet USDC has no value</p>
        <a href="#safety">Read safety note <Icon name="arrow" /></a>
      </div>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Probability home">
          <span className="brand-mark"><i /><i /><i /><i /></span>
          <span>Probability</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#markets">Markets</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#simulator">dApp</a>
          <a href="#docs">Docs</a>
          <a href="#mechanics">Mechanics</a>
          <a href="#safety">Safety</a>
        </nav>
        <a className="launch-app-button" href="#simulator">
          <span><small>WORKSPACE</small><strong>Launch dApp</strong></span>
          <Icon name="arrow" />
        </a>
      </header>
    </>
  )
}
