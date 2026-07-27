import unittest

from probability import BinaryLMSR


class BinaryLMSRTests(unittest.TestCase):
    def test_market_starts_at_equal_probability(self) -> None:
        market = BinaryLMSR()
        self.assertAlmostEqual(market.probabilities()["YES"], 0.5)
        self.assertAlmostEqual(market.probabilities()["NO"], 0.5)

    def test_buying_yes_increases_yes_probability(self) -> None:
        market = BinaryLMSR(liquidity=100)
        quote = market.buy("YES", 25)
        self.assertGreater(quote.price_after, quote.price_before)
        self.assertGreater(market.probabilities()["YES"], 0.5)

    def test_trade_collects_fee(self) -> None:
        market = BinaryLMSR(fee_bps=100)
        quote = market.buy("NO", 10)
        self.assertAlmostEqual(quote.fee, quote.gross_cost * 0.01)
        self.assertAlmostEqual(market.fees_collected, quote.fee)

    def test_probabilities_sum_to_one(self) -> None:
        market = BinaryLMSR()
        market.buy("YES", 40)
        prices = market.probabilities()
        self.assertAlmostEqual(prices["YES"] + prices["NO"], 1.0)

    def test_invalid_trade_is_rejected(self) -> None:
        market = BinaryLMSR()
        with self.assertRaises(ValueError):
            market.buy("YES", 0)


if __name__ == "__main__":
    unittest.main()

