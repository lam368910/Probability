const USDC_SCALE = 1_000_000n
const MAX_UINT256 = (1n << 256n) - 1n

export interface ParsedUsdcAmount {
  normalized: string
  units: bigint
}

/** Parse a user-entered ERC-20 USDC amount without passing through a JS number. */
export function parseUsdcAmount(value: string): ParsedUsdcAmount | null {
  const normalized = value.trim()
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,6}))?$/.exec(normalized)
  if (!match) return null

  const fraction = (match[2] ?? '').padEnd(6, '0')
  const units = BigInt(match[1]) * USDC_SCALE + BigInt(fraction || '0')
  if (units <= 0n || units > MAX_UINT256) return null
  return { normalized, units }
}

export function hasGasBuffer(balance: bigint, spend: bigint, buffer = 10_000n): boolean {
  return spend > 0n && balance >= spend + buffer
}

export function formatUsdcUnits(units: bigint): string {
  if (units < 0n) throw new Error('USDC units cannot be negative')
  const cents = (units + 5_000n) / 10_000n
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`
}
