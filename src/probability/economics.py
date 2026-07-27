"""LP accounting and yield metrics for binary LMSR markets."""

from dataclasses import dataclass
from math import exp, log

from .amm import BinaryLMSR
from .market import Resolution


def lmsr_capital_required(liquidity: float, outcomes: int = 2) -> float:
    """Return the LMSR worst-case subsidy, ``b * ln(outcomes)``.

    This bound applies to the scoring-rule loss before fees and excludes smart
    contract, oracle, depeg and operational risks.
    """

    if liquidity <= 0:
        raise ValueError("liquidity must be positive")
    if outcomes < 2:
        raise ValueError("outcomes must be at least 2")
    return liquidity * log(outcomes)


@dataclass(frozen=True)
class YieldMetrics:
    capital: float
    duration_days: float
    fees: float
    net_pnl: float
    fee_return: float
    fee_apr: float
    fee_apy: float
    net_return: float
    net_apr: float
    net_apy: float | None


def _annualized_metrics(value_return: float, duration_days: float) -> tuple[float, float | None]:
    apr = value_return * 365.0 / duration_days
    # Compounding a period loss of 100% or more is undefined in real numbers.
    if value_return <= -1:
        return apr, None
    exponent = 365.0 / duration_days
    try:
        apy = exp(log(1.0 + value_return) * exponent) - 1.0
    except OverflowError:
        apy = float("inf")
    return apr, apy


def calculate_yield_metrics(
    *, capital: float, duration_days: float, fees: float, net_pnl: float
) -> YieldMetrics:
    """Annualize realized period returns.

    APY is a mathematical extrapolation assuming repeatable compounding. It is
    not a forecast; short-period values can be especially misleading.
    """

    if capital <= 0:
        raise ValueError("capital must be positive")
    if duration_days <= 0:
        raise ValueError("duration_days must be positive")
    if fees < 0:
        raise ValueError("fees cannot be negative")
    fee_return = fees / capital
    net_return = net_pnl / capital
    fee_apr, fee_apy = _annualized_metrics(fee_return, duration_days)
    net_apr, net_apy = _annualized_metrics(net_return, duration_days)
    assert fee_apy is not None
    return YieldMetrics(
        capital=capital,
        duration_days=duration_days,
        fees=fees,
        net_pnl=net_pnl,
        fee_return=fee_return,
        fee_apr=fee_apr,
        fee_apy=fee_apy,
        net_return=net_return,
        net_apr=net_apr,
        net_apy=net_apy,
    )


@dataclass(frozen=True)
class LPValuation:
    capital_at_risk: float
    gross_trade_cash: float
    fees: float
    expected_or_realized_liability: float
    net_pnl: float
    ending_equity: float
    yield_metrics: YieldMetrics
    is_realized: bool


def value_lp(
    market: BinaryLMSR,
    *,
    duration_days: float,
    fair_yes_probability: float | None = None,
    resolution: Resolution | None = None,
) -> LPValuation:
    """Value the LP position at fair value or after resolution.

    Exactly one of ``fair_yes_probability`` and ``resolution`` is required.
    Mark-to-market liability uses the supplied external fair probability; it
    deliberately does not assume the AMM's own price is truth.
    """

    if (fair_yes_probability is None) == (resolution is None):
        raise ValueError("provide exactly one of fair_yes_probability or resolution")
    if resolution is not None:
        liability = resolution.total_liability(market.q_yes, market.q_no)
        is_realized = True
    else:
        assert fair_yes_probability is not None
        if not 0 <= fair_yes_probability <= 1:
            raise ValueError("fair_yes_probability must be between 0 and 1")
        liability = (
            market.q_yes * fair_yes_probability
            + market.q_no * (1.0 - fair_yes_probability)
        )
        is_realized = False

    capital = lmsr_capital_required(market.liquidity)
    pnl = market.gross_cash_collected + market.fees_collected - liability
    metrics = calculate_yield_metrics(
        capital=capital,
        duration_days=duration_days,
        fees=market.fees_collected,
        net_pnl=pnl,
    )
    return LPValuation(
        capital_at_risk=capital,
        gross_trade_cash=market.gross_cash_collected,
        fees=market.fees_collected,
        expected_or_realized_liability=liability,
        net_pnl=pnl,
        ending_equity=capital + pnl,
        yield_metrics=metrics,
        is_realized=is_realized,
    )
