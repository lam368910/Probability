"""Reproducible LP simulations with informed and noise trading."""

from dataclasses import dataclass
from random import Random

from .amm import BinaryLMSR, Outcome, TradeQuote
from .economics import LPValuation, value_lp
from .market import MarketSpec, Resolution


def _clamp_probability(value: float) -> float:
    return min(0.999, max(0.001, value))


@dataclass(frozen=True)
class SimulationConfig:
    market: MarketSpec
    trades_per_day: int = 20
    initial_true_probability: float = 0.5
    terminal_true_probability: float = 0.5
    daily_probability_volatility: float = 0.03
    informed_fraction: float = 0.2
    informed_edge_threshold: float = 0.01
    mean_trade_shares: float = 3.0
    max_trade_shares: float = 20.0
    seed: int = 1

    def __post_init__(self) -> None:
        if self.trades_per_day <= 0:
            raise ValueError("trades_per_day must be positive")
        for name, value in (
            ("initial_true_probability", self.initial_true_probability),
            ("terminal_true_probability", self.terminal_true_probability),
            ("informed_fraction", self.informed_fraction),
        ):
            if not 0 <= value <= 1:
                raise ValueError(f"{name} must be between 0 and 1")
        if self.daily_probability_volatility < 0:
            raise ValueError("daily_probability_volatility cannot be negative")
        if self.informed_edge_threshold < 0:
            raise ValueError("informed_edge_threshold cannot be negative")
        if self.mean_trade_shares <= 0 or self.max_trade_shares <= 0:
            raise ValueError("trade sizes must be positive")
        if self.mean_trade_shares > self.max_trade_shares:
            raise ValueError("mean_trade_shares cannot exceed max_trade_shares")


@dataclass(frozen=True)
class SimulatedTrade:
    step: int
    day: float
    informed: bool
    fair_yes_probability: float
    quote: TradeQuote


@dataclass(frozen=True)
class SimulationResult:
    config: SimulationConfig
    trades: tuple[SimulatedTrade, ...]
    final_true_probability: float
    resolution: Resolution
    mark_to_market: LPValuation
    realized: LPValuation
    total_volume: float
    informed_volume: float

    @property
    def gross_mtm_trading_loss(self) -> float:
        """Gross LP trading loss at final fair value, before fees.

        This intentionally does not claim to attribute the loss to informed
        traders; doing that requires a matched counterfactual simulation.
        """

        return max(
            0.0,
            self.mark_to_market.expected_or_realized_liability
            - self.mark_to_market.gross_trade_cash,
        )


def _choose_outcome(
    rng: Random,
    market: BinaryLMSR,
    fair_yes: float,
    informed: bool,
    threshold: float,
    shares: float,
) -> Outcome | None:
    if informed:
        yes_quote = market.quote_buy("YES", shares)
        no_quote = market.quote_buy("NO", shares)
        yes_edge = fair_yes - yes_quote.total_cost / shares
        no_edge = (1.0 - fair_yes) - no_quote.total_cost / shares
        best_edge = max(yes_edge, no_edge)
        if best_edge <= threshold:
            return None
        return "YES" if yes_edge >= no_edge else "NO"
    # Noise flow is probability-weighted but has no explicit edge test.
    return "YES" if rng.random() < fair_yes else "NO"


def run_simulation(
    config: SimulationConfig,
    *,
    resolution: Resolution | None = None,
) -> SimulationResult:
    """Run one seeded scenario.

    The latent probability follows a noisy bridge toward the configured
    terminal probability. Informed agents trade only when their estimated edge
    clears fees and the configured threshold; other agents generate noise flow.
    This is a stress-testing model, not a calibrated forecast of real order flow.
    """

    rng = Random(config.seed)
    market = BinaryLMSR(config.market.liquidity, config.market.fee_bps)
    steps = max(1, round(config.market.duration_days * config.trades_per_day))
    fair_yes = _clamp_probability(config.initial_true_probability)
    trades: list[SimulatedTrade] = []
    total_volume = 0.0
    informed_volume = 0.0
    step_volatility = config.daily_probability_volatility / config.trades_per_day**0.5

    for step in range(steps):
        remaining = steps - step
        bridge_drift = (config.terminal_true_probability - fair_yes) / remaining
        fair_yes = _clamp_probability(fair_yes + bridge_drift + rng.gauss(0, step_volatility))
        informed = rng.random() < config.informed_fraction
        shares = min(rng.expovariate(1.0 / config.mean_trade_shares), config.max_trade_shares)
        # expovariate can theoretically return zero; BinaryLMSR correctly
        # rejects it, so use a tiny positive floor for simulation continuity.
        shares = max(shares, 1e-9)
        outcome = _choose_outcome(
            rng,
            market,
            fair_yes,
            informed,
            config.informed_edge_threshold,
            shares,
        )
        if outcome is None:
            continue
        quote = market.buy(outcome, shares)
        notional = quote.gross_cost
        total_volume += notional
        if informed:
            informed_volume += notional
        trades.append(
            SimulatedTrade(
                step=step,
                day=(step + 1) / config.trades_per_day,
                informed=informed,
                fair_yes_probability=fair_yes,
                quote=quote,
            )
        )

    if resolution is None:
        resolution = Resolution.winner("YES" if rng.random() < fair_yes else "NO")
    mtm = value_lp(
        market,
        duration_days=config.market.duration_days,
        fair_yes_probability=fair_yes,
    )
    realized = value_lp(
        market,
        duration_days=config.market.duration_days,
        resolution=resolution,
    )
    return SimulationResult(
        config=config,
        trades=tuple(trades),
        final_true_probability=fair_yes,
        resolution=resolution,
        mark_to_market=mtm,
        realized=realized,
        total_volume=total_volume,
        informed_volume=informed_volume,
    )


@dataclass(frozen=True)
class AdverseSelectionScenario:
    name: str
    informed_fraction: float
    terminal_true_probability: float
    daily_probability_volatility: float
    informed_edge_threshold: float = 0.005

    def apply(self, market: MarketSpec, *, seed: int = 1) -> SimulationConfig:
        return SimulationConfig(
            market=market,
            terminal_true_probability=self.terminal_true_probability,
            daily_probability_volatility=self.daily_probability_volatility,
            informed_fraction=self.informed_fraction,
            informed_edge_threshold=self.informed_edge_threshold,
            seed=seed,
        )


CALM_MARKET = AdverseSelectionScenario(
    name="calm",
    informed_fraction=0.10,
    terminal_true_probability=0.55,
    daily_probability_volatility=0.01,
)

NEWS_SHOCK = AdverseSelectionScenario(
    name="news_shock",
    informed_fraction=0.70,
    terminal_true_probability=0.90,
    daily_probability_volatility=0.08,
)
