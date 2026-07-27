import { ARC_DEPLOYMENT, ARC_TESTNET } from '../config/arc'
import type { ArcWallet } from '../hooks/useArcWallet'
import { Icon } from './Icon'

const compactAddress = (address: string) => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Not connected'

export function ArcMvpPanel({ wallet }: { wallet: ArcWallet }) {
  const deploymentLabel = !wallet.deploymentConfigured
    ? 'Deployment staging'
    : wallet.deploymentReady ? 'Contracts live' : 'Contract unavailable'
  return (
    <section className="arc-panel" aria-label="Arc Testnet deployment status">
      <div>
        <span className={`arc-live-dot ${wallet.deploymentReady ? '' : 'arc-live-dot-muted'}`} />
        <p>ARC TESTNET MVP</p>
        <strong>{deploymentLabel}</strong>
      </div>
      <dl>
        <div><dt>NETWORK</dt><dd>Arc · {ARC_TESTNET.chainId}</dd></div>
        <div><dt>WALLET</dt><dd>{compactAddress(wallet.account)}</dd></div>
        <div><dt>USDC BALANCE</dt><dd>{wallet.balance}</dd></div>
        <div><dt>POOL RESERVES</dt><dd>{wallet.reserves}</dd></div>
      </dl>
      <p className="arc-message">{wallet.message}</p>
      <div className="arc-links">
        <button type="button" onClick={() => void wallet.refresh()} disabled={wallet.status === 'pending' || wallet.status === 'connecting'}>Refresh state</button>
        {wallet.deploymentConfigured ? <a href={`${ARC_TESTNET.explorerUrl}/address/${ARC_DEPLOYMENT.market}`} target="_blank" rel="noreferrer">Configured market <Icon name="arrow" /></a> : null}
        {wallet.txHash ? <a href={`${ARC_TESTNET.explorerUrl}/tx/${wallet.txHash}`} target="_blank" rel="noreferrer">Latest transaction <Icon name="arrow" /></a> : null}
      </div>
    </section>
  )
}
