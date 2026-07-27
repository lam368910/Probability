import { Icon } from './Icon'
import type { ArcWallet } from '../hooks/useArcWallet'

export function Header({ wallet }: { wallet: ArcWallet }) {
  const walletLabel = wallet.account
    ? wallet.networkReady ? `${wallet.account.slice(0, 6)}…${wallet.account.slice(-4)}` : 'Switch to Arc'
    : 'Connect Arc wallet'
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
          <a href="#mechanics">Mechanics</a>
          <a href="#safety">Safety</a>
        </nav>
        <button className="wallet-button" type="button" onClick={() => void wallet.connect()} disabled={wallet.status === 'connecting' || wallet.status === 'pending'}>
          <span className={`status-dot ${wallet.networkReady ? '' : 'status-dot-muted'}`} /> {walletLabel}
          <Icon name="chevron" />
        </button>
      </header>
    </>
  )
}
