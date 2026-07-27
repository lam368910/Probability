import { Icon } from './Icon'

const items = [
  ['01', 'Supply both sides', 'Capital is distributed across YES and NO inventory to quote a continuous market.'],
  ['02', 'Facilitate discovery', 'Every trade moves the implied probability and pays a disclosed trading fee.'],
  ['03', 'Collect the flow', 'The demo split is 80% to LPs and 20% to the protocol treasury; LPs remain exposed to inventory and informed traders.'],
]

export function Mechanics() {
  return (
    <section className="mechanics" id="mechanics">
      <div className="mechanics-title"><p className="eyebrow-text">THE MECHANISM</p><h2>Liquidity is the<br /><em>other side of opinion.</em></h2></div>
      <div className="mechanic-grid">{items.map(([num, title, text]) => <article key={num}><span>{num}</span><div className="mechanic-icon"><Icon name={num === '01' ? 'droplet' : num === '02' ? 'spark' : 'plus'} /></div><h3>{title}</h3><p>{text}</p></article>)}</div>
    </section>
  )
}

export function Safety() {
  return (
    <section className="safety" id="safety">
      <div><Icon name="shield" /><span>SAFETY NOTE · READ BEFORE USING</span></div>
      <h2>This is a public interface prototype.<br />Not a live financial product.</h2>
      <div className="safety-grid"><p><strong>Unaudited software</strong>The protocol and interface have not undergone an independent security audit.</p><p><strong>Demo versus onchain</strong>Market cards, portfolio balances, and return estimates are simulated. Only actions explicitly naming the Arc contract can submit testnet transactions; testnet assets have no value.</p><p><strong>LP capital is at risk</strong>Fees may not offset loss from probability movement, informed flow, oracle failure, or smart-contract exploits.</p></div>
    </section>
  )
}
