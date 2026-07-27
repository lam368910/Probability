import math
import unittest

from probability import (
    BinaryLMSR,
    MarketSpec,
    MarketStatus,
    Resolution,
    SimulationConfig,
    calculate_yield_metrics,
    lmsr_capital_required,
    run_simulation,
    value_lp,
)


class ResolutionTests(unittest.TestCase):
    def test_winner_payout_vector(self) -> None:
        resolution = Resolution.winner("YES")
        self.assertEqual(resolution.status, MarketStatus.RESOLVED)
        self.assertEqual(resolution.yes_payout, 1.0)
        self.assertEqual(resolution.no_payout, 0.0)
        self.assertEqual(resolution.total_liability(12, 7), 12)

    def test_invalid_market_can_split_payout(self) -> None:
        resolution = Resolution.invalid(0.5, "ambiguous source")
        self.assertEqual(resolution.status, MarketStatus.INVALID)
        self.assertEqual(resolution.total_liability(12, 8), 10)

    def test_resolution_rejects_invalid_probability(self) -> None:
        with self.assertRaises(ValueError):
            Resolution(1.1, MarketStatus.RESOLVED)


class LPAccountingTests(unittest.TestCase):
    def test_lmsr_capital_bound(self) -> None:
        self.assertAlmostEqual(lmsr_capital_required(100), 100 * math.log(2))

    def test_no_trade_has_zero_pnl(self) -> None:
        market = BinaryLMSR(liquidity=100)
        valuation = value_lp(market, duration_days=30, resolution=Resolution.winner("YES"))
        self.assertEqual(valuation.net_pnl, 0)
        self.assertAlmostEqual(valuation.ending_equity, 100 * math.log(2))

    def test_realized_pnl_includes_liability_and_fees(self) -> None:
        market = BinaryLMSR(liquidity=100, fee_bps=100)
        market.buy("YES", 25)
        valuation = value_lp(market, duration_days=30, resolution=Resolution.winner("YES"))
        expected = market.gross_cash_collected + market.fees_collected - 25
        self.assertAlmostEqual(valuation.net_pnl, expected)
        self.assertTrue(valuation.is_realized)

    def test_mark_to_market_uses_external_probability(self) -> None:
        market = BinaryLMSR(liquidity=100, fee_bps=0)
        market.buy("YES", 10)
        low = value_lp(market, duration_days=7, fair_yes_probability=0.2)
        high = value_lp(market, duration_days=7, fair_yes_probability=0.8)
        self.assertGreater(low.net_pnl, high.net_pnl)
        self.assertFalse(low.is_realized)

    def test_fee_revenue_is_not_assumed_to_be_net_profit(self) -> None:
        market = BinaryLMSR(liquidity=50, fee_bps=100)
        market.buy("YES", 100)
        valuation = value_lp(market, duration_days=30, resolution=Resolution.winner("YES"))
        self.assertGreater(valuation.fees, 0)
        self.assertLess(valuation.net_pnl, 0)

    def test_scoring_rule_loss_stays_within_capital_bound_without_fees(self) -> None:
        market = BinaryLMSR(liquidity=20, fee_bps=0)
        market.buy("YES", 1_000)
        valuation = value_lp(market, duration_days=30, resolution=Resolution.winner("YES"))
        self.assertGreaterEqual(valuation.net_pnl + lmsr_capital_required(20), -1e-9)
        self.assertGreaterEqual(valuation.ending_equity, -1e-9)

    def test_valuation_requires_exactly_one_basis(self) -> None:
        market = BinaryLMSR()
        with self.assertRaises(ValueError):
            value_lp(market, duration_days=30)
        with self.assertRaises(ValueError):
            value_lp(
                market,
                duration_days=30,
                fair_yes_probability=0.5,
                resolution=Resolution.winner("YES"),
            )


class YieldMetricTests(unittest.TestCase):
    def test_period_metrics(self) -> None:
        metrics = calculate_yield_metrics(
            capital=1_000, duration_days=365, fees=20, net_pnl=-10
        )
        self.assertAlmostEqual(metrics.fee_apr, 0.02)
        self.assertAlmostEqual(metrics.fee_apy, 0.02)
        self.assertAlmostEqual(metrics.net_return, -0.01)

    def test_total_loss_has_no_compound_apy(self) -> None:
        metrics = calculate_yield_metrics(
            capital=100, duration_days=30, fees=0, net_pnl=-100
        )
        self.assertIsNone(metrics.net_apy)

    def test_metric_inputs_are_validated(self) -> None:
        with self.assertRaises(ValueError):
            calculate_yield_metrics(capital=0, duration_days=30, fees=1, net_pnl=1)
        with self.assertRaises(ValueError):
            calculate_yield_metrics(capital=100, duration_days=0, fees=1, net_pnl=1)


class SimulationTests(unittest.TestCase):
    def make_config(self, seed: int = 7) -> SimulationConfig:
        return SimulationConfig(
            market=MarketSpec(
                market_id="eth-5k",
                question="Will ETH trade above $5,000?",
                liquidity=100,
                fee_bps=100,
                duration_days=3,
            ),
            trades_per_day=8,
            initial_true_probability=0.45,
            terminal_true_probability=0.7,
            daily_probability_volatility=0.02,
            informed_fraction=0.4,
            seed=seed,
        )

    def test_seeded_simulation_is_reproducible(self) -> None:
        first = run_simulation(self.make_config(), resolution=Resolution.winner("YES"))
        second = run_simulation(self.make_config(), resolution=Resolution.winner("YES"))
        self.assertEqual(first.trades, second.trades)
        self.assertEqual(first.realized, second.realized)

    def test_result_accounting_reconciles(self) -> None:
        result = run_simulation(self.make_config(), resolution=Resolution.winner("NO"))
        self.assertGreater(len(result.trades), 0)
        self.assertAlmostEqual(
            result.total_volume,
            sum(trade.quote.gross_cost for trade in result.trades),
        )
        self.assertLessEqual(result.informed_volume, result.total_volume)
        self.assertGreaterEqual(result.gross_mtm_trading_loss, 0)
        self.assertTrue(result.realized.is_realized)
        self.assertFalse(result.mark_to_market.is_realized)

    def test_simulated_prices_and_probability_stay_bounded(self) -> None:
        result = run_simulation(self.make_config())
        self.assertGreater(result.final_true_probability, 0)
        self.assertLess(result.final_true_probability, 1)
        for trade in result.trades:
            self.assertGreater(trade.quote.price_after, 0)
            self.assertLess(trade.quote.price_after, 1)

    def test_informed_trades_have_positive_edge_after_fees_and_price_impact(self) -> None:
        result = run_simulation(self.make_config())
        for trade in result.trades:
            if not trade.informed:
                continue
            fair_payout = (
                trade.fair_yes_probability
                if trade.quote.outcome == "YES"
                else 1.0 - trade.fair_yes_probability
            ) * trade.quote.shares
            minimum_edge = result.config.informed_edge_threshold * trade.quote.shares
            self.assertGreater(fair_payout - trade.quote.total_cost, minimum_edge)

    def test_config_validation(self) -> None:
        market = MarketSpec("m", "question")
        with self.assertRaises(ValueError):
            SimulationConfig(market, trades_per_day=0)
        with self.assertRaises(ValueError):
            SimulationConfig(market, informed_fraction=1.1)


if __name__ == "__main__":
    unittest.main()
