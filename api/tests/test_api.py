import unittest

try:
    from fastapi.testclient import TestClient

    from api.main import app
except ImportError:  # API dependencies are optional for the core package.
    TestClient = None
    app = None


@unittest.skipIf(TestClient is None, "install the api extra to test HTTP endpoints")
class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(app)

    def test_health(self) -> None:
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["mode"], "demo")

    def test_markets_are_available(self) -> None:
        response = self.client.get("/v1/markets")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.json()), 3)

    def test_quote_has_fee_and_price_impact(self) -> None:
        response = self.client.post(
            "/v1/quote",
            json={"outcome": "YES", "shares": 25, "liquidity": 100, "fee_bps": 100},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(data["fee"], 0)
        self.assertGreater(data["price_after"], data["price_before"])

    def test_invalid_quote_is_rejected(self) -> None:
        response = self.client.post(
            "/v1/quote", json={"outcome": "YES", "shares": 0}
        )
        self.assertEqual(response.status_code, 422)

        tiny_liquidity = self.client.post(
            "/v1/quote",
            json={"outcome": "YES", "shares": 10, "liquidity": 1e-12},
        )
        self.assertEqual(tiny_liquidity.status_code, 422)

        non_finite = self.client.post(
            "/v1/quote",
            content='{"outcome":"YES","shares":NaN}',
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(non_finite.status_code, 422)

    def test_lp_simulation_returns_net_pnl(self) -> None:
        response = self.client.post(
            "/v1/simulations/lp",
            json={
                "preset": "news_shock",
                "duration_days": 5,
                "trades_per_day": 5,
                "seed": 7,
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("net_pnl", data["realized"])
        self.assertIn("not a forecast", data["disclaimer"])

    def test_lp_simulation_rejects_invalid_trade_sizes(self) -> None:
        response = self.client.post(
            "/v1/simulations/lp",
            json={"mean_trade_shares": 30, "max_trade_shares": 20},
        )
        self.assertEqual(response.status_code, 422)

        tiny_duration = self.client.post(
            "/v1/simulations/lp",
            json={"duration_days": 5e-324},
        )
        self.assertEqual(tiny_duration.status_code, 422)


if __name__ == "__main__":
    unittest.main()
