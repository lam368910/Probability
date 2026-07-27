const compactUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })
const preciseUsd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const formatCompactUsd = (value: number) => compactUsd.format(value)
export const formatUsd = (value: number) => preciseUsd.format(value)

export function calculateLiquidityQuote(amount: number, marketApr: number, durationDays: number) {
  const grossFees = amount * (marketApr / 100) * (durationDays / 365)
  const rangeLossEstimate = amount * 0.014 * Math.sqrt(durationDays / 30)
  return {
    grossFees,
    rangeLossEstimate,
    netEstimate: grossFees - rangeLossEstimate,
  }
}

export function calculateTradeQuote(amount: number, probability: number, feeBps = 30) {
  const executionProbability = Math.min(99, probability + Math.min(8, amount / 1500))
  const fee = amount * (feeBps / 10_000)
  return {
    shares: (amount - fee) / (executionProbability / 100),
    fee,
    executionProbability,
  }
}
