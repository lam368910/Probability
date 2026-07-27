from datetime import UTC, datetime, timedelta


def demo_markets() -> list[dict[str, object]]:
    now = datetime.now(UTC)
    return [
        {
            "id": "eth-10k-2027",
            "question": "Will ETH trade at or above $10,000 before 2027?",
            "category": "crypto",
            "yes_probability": 0.43,
            "liquidity_usd": 184_250.0,
            "volume_24h_usd": 62_840.0,
            "fee_bps": 100,
            "closes_at": now + timedelta(days=120),
            "resolution_source": "Coinbase ETH-USD daily high",
            "status": "open",
        },
        {
            "id": "fed-cut-q4",
            "question": "Will the US policy rate be cut before Q4 ends?",
            "category": "macro",
            "yes_probability": 0.61,
            "liquidity_usd": 241_900.0,
            "volume_24h_usd": 91_320.0,
            "fee_bps": 125,
            "closes_at": now + timedelta(days=72),
            "resolution_source": "Federal Reserve press releases",
            "status": "open",
        },
        {
            "id": "global-temp-record",
            "question": "Will 2026 be the warmest year in the cited dataset?",
            "category": "climate",
            "yes_probability": 0.34,
            "liquidity_usd": 96_400.0,
            "volume_24h_usd": 18_760.0,
            "fee_bps": 150,
            "closes_at": now + timedelta(days=165),
            "resolution_source": "NASA GISTEMP annual release",
            "status": "open",
        },
    ]

