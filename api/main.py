import math
import os

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from probability import (
    CALM_MARKET,
    NEWS_SHOCK,
    BinaryLMSR,
    MarketSpec,
    SimulationConfig,
    run_simulation,
)

from .markets import demo_markets
from .schemas import (
    HealthResponse,
    Market,
    QuoteRequest,
    QuoteResponse,
    SimulationRequest,
    SimulationResponse,
    ValuationSummary,
)


def _allowed_origins() -> list[str]:
    configured = os.getenv("PROBABILITY_CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in configured.split(",") if origin.strip()]


app = FastAPI(
    title="Probability Analytics API",
    version="0.2.0",
    description=(
        "Read-only market data and AMM simulation API. This service does not "
        "custody funds, execute trades, or guarantee returns."
    ),
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


def _json_safe(value: object) -> object:
    """Make validation details safe for strict JSON serialization."""
    if isinstance(value, float) and not math.isfinite(value):
        return None
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(item) for item in value]
    return value


@app.exception_handler(RequestValidationError)
async def request_validation_handler(
    _request: object, exc: RequestValidationError
) -> JSONResponse:
    # Starlette intentionally refuses to serialize NaN/Infinity. Pydantic
    # catches them, but their original value can still appear in exc.errors().
    return JSONResponse(status_code=422, content={"detail": _json_safe(exc.errors())})


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok", service="probability-analytics", version="0.2.0", mode="demo"
    )


@app.get("/v1/markets", response_model=list[Market])
def list_markets() -> list[Market]:
    return [Market.model_validate(market) for market in demo_markets()]


@app.get("/v1/markets/{market_id}", response_model=Market)
def get_market(market_id: str) -> Market:
    market = next((item for item in demo_markets() if item["id"] == market_id), None)
    if market is None:
        raise HTTPException(status_code=404, detail="market not found")
    return Market.model_validate(market)


@app.post("/v1/quote", response_model=QuoteResponse)
def quote(request: QuoteRequest) -> QuoteResponse:
    market = BinaryLMSR(liquidity=request.liquidity, fee_bps=request.fee_bps)
    market.q_yes = request.yes_shares
    market.q_no = request.no_shares
    trade = market.quote_buy(request.outcome, request.shares)
    average_price = trade.gross_cost / trade.shares
    return QuoteResponse(
        outcome=trade.outcome,
        shares=trade.shares,
        gross_cost=trade.gross_cost,
        fee=trade.fee,
        total_cost=trade.total_cost,
        average_price=average_price,
        price_before=trade.price_before,
        price_after=trade.price_after,
        price_impact=trade.price_after - trade.price_before,
    )


def _finite(value: float | None) -> float | None:
    if value is None or not math.isfinite(value):
        return None
    return value


def _valuation_summary(valuation: object) -> ValuationSummary:
    metrics = valuation.yield_metrics
    return ValuationSummary(
        capital_at_risk=valuation.capital_at_risk,
        gross_trade_cash=valuation.gross_trade_cash,
        fees=valuation.fees,
        liability=valuation.expected_or_realized_liability,
        net_pnl=valuation.net_pnl,
        ending_equity=valuation.ending_equity,
        net_return=metrics.net_return,
        net_apr=_finite(metrics.net_apr),
        net_apy=_finite(metrics.net_apy),
    )


@app.post("/v1/simulations/lp", response_model=SimulationResponse)
def simulate_lp(request: SimulationRequest) -> SimulationResponse:
    if request.mean_trade_shares > request.max_trade_shares:
        raise HTTPException(
            status_code=422,
            detail="mean_trade_shares cannot exceed max_trade_shares",
        )

    market = MarketSpec(
        market_id="api-simulation",
        question="API simulation",
        liquidity=request.liquidity,
        fee_bps=request.fee_bps,
        duration_days=request.duration_days,
    )
    if request.preset == "calm":
        base = CALM_MARKET.apply(market, seed=request.seed)
        config = SimulationConfig(
            **{
                **base.__dict__,
                "trades_per_day": request.trades_per_day,
                "mean_trade_shares": request.mean_trade_shares,
                "max_trade_shares": request.max_trade_shares,
            }
        )
    elif request.preset == "news_shock":
        base = NEWS_SHOCK.apply(market, seed=request.seed)
        config = SimulationConfig(
            **{
                **base.__dict__,
                "trades_per_day": request.trades_per_day,
                "mean_trade_shares": request.mean_trade_shares,
                "max_trade_shares": request.max_trade_shares,
            }
        )
    else:
        config = SimulationConfig(
            market=market,
            trades_per_day=request.trades_per_day,
            initial_true_probability=request.initial_true_probability,
            terminal_true_probability=request.terminal_true_probability,
            daily_probability_volatility=request.daily_probability_volatility,
            informed_fraction=request.informed_fraction,
            mean_trade_shares=request.mean_trade_shares,
            max_trade_shares=request.max_trade_shares,
            seed=request.seed,
        )

    result = run_simulation(config)
    informed_share = (
        result.informed_volume / result.total_volume if result.total_volume else 0.0
    )
    return SimulationResponse(
        preset=request.preset,
        trade_count=len(result.trades),
        final_true_probability=result.final_true_probability,
        resolution_status=result.resolution.status.value,
        yes_payout=result.resolution.yes_payout,
        total_volume=result.total_volume,
        informed_volume=result.informed_volume,
        informed_volume_share=informed_share,
        gross_mtm_trading_loss=result.gross_mtm_trading_loss,
        mark_to_market=_valuation_summary(result.mark_to_market),
        realized=_valuation_summary(result.realized),
        disclaimer=(
            "Synthetic stress test, not a forecast or promise of returns. "
            "Results omit smart-contract, oracle, collateral and regulatory risk."
        ),
    )
