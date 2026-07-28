import { ARC_DEPLOYMENT, ARC_TESTNET } from '../config/arc'
import type { ArcWallet } from '../hooks/useArcWallet'
import { Icon } from './Icon'

const compactAddress = (address: string) => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Not connected'

export function ArcMvpPanel({ wallet }: { wallet: ArcWallet }) {
  const deploymentLabel = !wallet.deploymentConfigured
    ? 'Deployment staging'
    : wallet.deploymentReady ? 'Ready on testnet' : 'Contract unavailable'

  return (
    <section className="arc-panel" aria-label="Arc Testnet deployment status">
      <header className="arc-panel-head">
        <div className="arc-panel-title">
          <span><i className={`arc-live-dot ${wallet.deploymentReady ? '' : 'arc-live-dot-muted'}`} /> ARC TESTNET MVP</span>
          <h2>Onchain system status</h2>
          <p>This panel shows which network, wallet and AMM pool the action buttons actually use.</p>
        </div>
        <strong className={`arc-status-chip ${wallet.deploymentReady ? 'is-ready' : ''}`}>{deploymentLabel}</strong>
      </header>

      <dl className="arc-metrics">
        <div>
          <dt>BLOCKCHAIN</dt>
          <dd>Arc Testnet</dd>
          <small>Chain ID {ARC_TESTNET.chainId}</small>
        </div>
        <div>
          <dt>CONNECTED WALLET</dt>
          <dd>{compactAddress(wallet.account)}</dd>
          <small>{wallet.account ? 'Your active EVM account' : 'Connect inside the dApp workspace'}</small>
        </div>
        <div>
          <dt>YOUR TEST USDC</dt>
          <dd>{wallet.balance}</dd>
          <small>Wallet balance available for test actions</small>
        </div>
        <div>
          <dt>AMM POOL RESERVES</dt>
          <dd>{wallet.reserves}</dd>
          <small>YES reserve / NO reserve inside the contract</small>
        </div>
      </dl>

      <footer className="arc-panel-foot">
        <p><b>CURRENT STATE</b><span>{wallet.message}</span></p>
        <div className="arc-links">
          <button type="button" onClick={() => void wallet.refresh()} disabled={wallet.status === 'pending' || wallet.status === 'connecting'}>Refresh onchain data</button>
          {wallet.deploymentConfigured ? <a href={`${ARC_TESTNET.explorerUrl}/address/${ARC_DEPLOYMENT.market}`} target="_blank" rel="noreferrer">Open market contract <Icon name="arrow" /></a> : null}
          {wallet.txHash ? <a href={`${ARC_TESTNET.explorerUrl}/tx/${wallet.txHash}`} target="_blank" rel="noreferrer">View latest transaction <Icon name="arrow" /></a> : null}
        </div>
      </footer>
    </section>
  )
}
