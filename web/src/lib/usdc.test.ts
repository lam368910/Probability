import { describe, expect, it } from 'vitest'
import { formatUsdcUnits, hasGasBuffer, parseUsdcAmount } from './usdc'

describe('USDC amount parsing', () => {
  it('preserves six-decimal token precision without JS number rounding', () => {
    expect(parseUsdcAmount('9007199254740993.123456')).toEqual({
      normalized: '9007199254740993.123456',
      units: 9_007_199_254_740_993_123_456n,
    })
    expect(parseUsdcAmount('0.000001')?.units).toBe(1n)
  })

  it('rejects ambiguous, non-positive, and over-precision inputs', () => {
    for (const value of ['', '0', '-1', '1e3', '.5', '01', '1.', '1.0000001', 'NaN']) {
      expect(parseUsdcAmount(value), value).toBeNull()
    }
  })

  it('requires a small native-USDC gas buffer', () => {
    expect(hasGasBuffer(1_010_000n, 1_000_000n)).toBe(true)
    expect(hasGasBuffer(1_009_999n, 1_000_000n)).toBe(false)
  })

  it('formats large balances without converting them to an imprecise number', () => {
    expect(formatUsdcUnits(9_007_199_254_740_993_129_999n)).toBe('9007199254740993.13')
  })
})
