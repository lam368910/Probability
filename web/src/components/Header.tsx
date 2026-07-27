import { Icon } from './Icon'

export function Header() {
  const scrollToMarkets = () => document.querySelector('#markets')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <>
      <div className="testnet-ribbon" role="status">
        <span>PUBLIC DEMO</span>
        <p>Unaudited prototype · Demo assets have no value</p>
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
          <a href="#mechanics">Mechanics</a>
          <a href="#safety">Safety</a>
        </nav>
        <button className="wallet-button" type="button" onClick={scrollToMarkets}>
          <span className="status-dot" /> Demo mode
          <Icon name="chevron" />
        </button>
      </header>
    </>
  )
}
