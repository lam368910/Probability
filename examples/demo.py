from probability import BinaryLMSR


market = BinaryLMSR(liquidity=100, fee_bps=100)
print("Initial market:", market.snapshot())

quote = market.buy("YES", 25)
print("YES trade:", quote)
print("Updated market:", market.snapshot())

