"""A small LMSR-based AMM prototype for binary prediction markets."""

from dataclasses import dataclass
from math import exp, log
from typing import Literal

Outcome = Literal["YES", "NO"]


@dataclass(frozen=True)
class TradeQuote:
    outcome: Outcome
    shares: float
    gross_cost: float
    fee: float
    total_cost: float
    price_before: float
    price_after: float


class BinaryLMSR:
    """Binary logarithmic market scoring rule market maker.

    `liquidity` controls market depth: larger values reduce price movement.
    Prices are normalized between 0 and 1 and sum to one.
    """

    def __init__(self, liquidity: float = 100.0, fee_bps: int = 100) -> None:
        if liquidity <= 0:
            raise ValueError("liquidity must be positive")
        if not 0 <= fee_bps <= 10_000:
            raise ValueError("fee_bps must be between 0 and 10,000")
        self.liquidity = float(liquidity)
        self.fee_bps = int(fee_bps)
        self.q_yes = 0.0
        self.q_no = 0.0
        self.fees_collected = 0.0

    def _cost(self, q_yes: float, q_no: float) -> float:
        scaled_yes = q_yes / self.liquidity
        scaled_no = q_no / self.liquidity
        pivot = max(scaled_yes, scaled_no)
        return self.liquidity * (
            pivot + log(exp(scaled_yes - pivot) + exp(scaled_no - pivot))
        )

    def probabilities(self) -> dict[Outcome, float]:
        pivot = max(self.q_yes, self.q_no) / self.liquidity
        yes_weight = exp(self.q_yes / self.liquidity - pivot)
        no_weight = exp(self.q_no / self.liquidity - pivot)
        total = yes_weight + no_weight
        return {"YES": yes_weight / total, "NO": no_weight / total}

    def quote_buy(self, outcome: Outcome, shares: float) -> TradeQuote:
        if outcome not in ("YES", "NO"):
            raise ValueError("outcome must be YES or NO")
        if shares <= 0:
            raise ValueError("shares must be positive")

        before = self.probabilities()[outcome]
        old_cost = self._cost(self.q_yes, self.q_no)
        next_yes = self.q_yes + shares if outcome == "YES" else self.q_yes
        next_no = self.q_no + shares if outcome == "NO" else self.q_no
        gross_cost = self._cost(next_yes, next_no) - old_cost
        fee = gross_cost * self.fee_bps / 10_000

        if outcome == "YES":
            after = BinaryLMSR._probability(next_yes, next_no, self.liquidity)
        else:
            after = BinaryLMSR._probability(next_no, next_yes, self.liquidity)

        return TradeQuote(
            outcome=outcome,
            shares=shares,
            gross_cost=gross_cost,
            fee=fee,
            total_cost=gross_cost + fee,
            price_before=before,
            price_after=after,
        )

    def buy(self, outcome: Outcome, shares: float) -> TradeQuote:
        quote = self.quote_buy(outcome, shares)
        if outcome == "YES":
            self.q_yes += shares
        else:
            self.q_no += shares
        self.fees_collected += quote.fee
        return quote

    @staticmethod
    def _probability(selected: float, other: float, liquidity: float) -> float:
        delta = (other - selected) / liquidity
        if delta >= 0:
            weight = exp(-delta)
            return weight / (1 + weight)
        weight = exp(delta)
        return 1 / (1 + weight)

    def snapshot(self) -> dict[str, float]:
        prices = self.probabilities()
        return {
            "yes_shares": self.q_yes,
            "no_shares": self.q_no,
            "yes_probability": prices["YES"],
            "no_probability": prices["NO"],
            "fees_collected": self.fees_collected,
        }

