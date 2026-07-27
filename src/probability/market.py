"""Typed market and resolution models used by accounting and simulations."""

from dataclasses import dataclass
from enum import Enum

from .amm import Outcome


class MarketStatus(str, Enum):
    OPEN = "open"
    RESOLVED = "resolved"
    INVALID = "invalid"


@dataclass(frozen=True)
class MarketSpec:
    """Economic terms for a binary market.

    ``duration_days`` is the capital deployment period used by annualized
    metrics. It is not an oracle deadline or a promise that resolution is
    timely.
    """

    market_id: str
    question: str
    liquidity: float = 100.0
    fee_bps: int = 100
    duration_days: float = 30.0

    def __post_init__(self) -> None:
        if not self.market_id.strip():
            raise ValueError("market_id must not be empty")
        if not self.question.strip():
            raise ValueError("question must not be empty")
        if self.liquidity <= 0:
            raise ValueError("liquidity must be positive")
        if not 0 <= self.fee_bps <= 10_000:
            raise ValueError("fee_bps must be between 0 and 10,000")
        if self.duration_days <= 0:
            raise ValueError("duration_days must be positive")


@dataclass(frozen=True)
class Resolution:
    """A binary payout vector.

    Normal resolution pays one unit to the winner and zero to the loser.
    Invalid or ambiguous markets can use a split payout such as 0.5/0.5.
    The two payout values always sum to one.
    """

    yes_payout: float
    status: MarketStatus
    reason: str = ""

    def __post_init__(self) -> None:
        if not 0 <= self.yes_payout <= 1:
            raise ValueError("yes_payout must be between 0 and 1")
        if self.status is MarketStatus.OPEN:
            raise ValueError("a Resolution cannot have open status")

    @property
    def no_payout(self) -> float:
        return 1.0 - self.yes_payout

    @classmethod
    def winner(cls, outcome: Outcome, reason: str = "") -> "Resolution":
        if outcome not in ("YES", "NO"):
            raise ValueError("outcome must be YES or NO")
        return cls(
            yes_payout=1.0 if outcome == "YES" else 0.0,
            status=MarketStatus.RESOLVED,
            reason=reason,
        )

    @classmethod
    def invalid(cls, split: float = 0.5, reason: str = "") -> "Resolution":
        return cls(yes_payout=split, status=MarketStatus.INVALID, reason=reason)

    def payout_for(self, outcome: Outcome) -> float:
        if outcome == "YES":
            return self.yes_payout
        if outcome == "NO":
            return self.no_payout
        raise ValueError("outcome must be YES or NO")

    def total_liability(self, yes_shares: float, no_shares: float) -> float:
        if yes_shares < 0 or no_shares < 0:
            raise ValueError("share quantities cannot be negative")
        return yes_shares * self.yes_payout + no_shares * self.no_payout
