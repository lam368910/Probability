from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Market(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    id: str
    question: str
    category: str
    yes_probability: float = Field(ge=0, le=1)
    liquidity_usd: float = Field(ge=0)
    volume_24h_usd: float = Field(ge=0)
    fee_bps: int = Field(ge=0, le=10_000)
    closes_at: datetime
    resolution_source: str
    status: Literal["open", "closed", "proposed", "resolved", "cancelled"]


class QuoteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    outcome: Literal["YES", "NO"]
    shares: float = Field(gt=0, le=1_000_000)
    liquidity: float = Field(default=100, ge=0.000001, le=100_000_000)
    fee_bps: int = Field(default=100, ge=0, le=1_000)
    yes_shares: float = Field(default=0, ge=0, le=1_000_000_000)
    no_shares: float = Field(default=0, ge=0, le=1_000_000_000)


class QuoteResponse(BaseModel):
    outcome: Literal["YES", "NO"]
    shares: float
    gross_cost: float
    fee: float
    total_cost: float
    average_price: float
    price_before: float
    price_after: float
    price_impact: float


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    mode: Literal["demo"]


class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    preset: Literal["custom", "calm", "news_shock"] = "custom"
    liquidity: float = Field(default=100, ge=0.000001, le=10_000_000)
    fee_bps: int = Field(default=100, ge=0, le=1_000)
    duration_days: float = Field(default=30, ge=1 / 1440, le=90)
    trades_per_day: int = Field(default=20, gt=0, le=50)
    initial_true_probability: float = Field(default=0.5, ge=0, le=1)
    terminal_true_probability: float = Field(default=0.5, ge=0, le=1)
    daily_probability_volatility: float = Field(default=0.03, ge=0, le=0.5)
    informed_fraction: float = Field(default=0.2, ge=0, le=1)
    mean_trade_shares: float = Field(default=3, gt=0, le=100_000)
    max_trade_shares: float = Field(default=20, gt=0, le=1_000_000)
    seed: int = Field(default=1, ge=0, le=2_147_483_647)


class ValuationSummary(BaseModel):
    capital_at_risk: float
    gross_trade_cash: float
    fees: float
    liability: float
    net_pnl: float
    ending_equity: float
    net_return: float
    net_apr: float | None
    net_apy: float | None


class SimulationResponse(BaseModel):
    preset: Literal["custom", "calm", "news_shock"]
    trade_count: int
    final_true_probability: float
    resolution_status: str
    yes_payout: float
    total_volume: float
    informed_volume: float
    informed_volume_share: float
    gross_mtm_trading_loss: float
    mark_to_market: ValuationSummary
    realized: ValuationSummary
    disclaimer: str
