"""Run with: python examples/risk_simulation.py"""

from probability import MarketSpec, NEWS_SHOCK, Resolution, run_simulation


market = MarketSpec(
    market_id="example-election",
    question="Will the candidate win?",
    liquidity=10_000,
    fee_bps=100,
    duration_days=30,
)
result = run_simulation(
    NEWS_SHOCK.apply(market, seed=42),
    resolution=Resolution.winner("YES", "Example oracle result"),
)

print(f"trades: {len(result.trades)}")
print(f"gross volume: {result.total_volume:,.2f}")
print(f"fees: {result.realized.fees:,.2f}")
print(f"realized LP P&L: {result.realized.net_pnl:,.2f}")
print(f"net period return: {result.realized.yield_metrics.net_return:.2%}")
print("Simulation output is a scenario, not a forecast or guaranteed return.")
