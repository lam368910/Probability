import { describe, expect, it } from 'vitest'
import { ARC_TESTNET } from './arc'
import { switchToArc, type EthereumProvider } from '../hooks/useArcWallet'

describe('Arc wallet configuration', () => {
  it('keeps the decimal and EIP-3085 hexadecimal chain IDs identical', () => {
    expect(Number.parseInt(ARC_TESTNET.chainIdHex.slice(2), 16)).toBe(ARC_TESTNET.chainId)
    expect(ARC_TESTNET.rpcUrl).toBe('https://rpc.testnet.arc.io')
  })

  it('adds an unknown chain with 18-decimal native USDC and selects it', async () => {
    const calls: Array<{ method: string; params?: unknown[] | Record<string, unknown> }> = []
    let switchAttempts = 0
    const provider: EthereumProvider = {
      async request(args) {
        calls.push(args)
        if (args.method === 'wallet_switchEthereumChain' && switchAttempts++ === 0) throw { code: 4902 }
        if (args.method === 'eth_chainId') return ARC_TESTNET.chainIdHex
        return null
      },
    }

    await switchToArc(provider)

    const addCall = calls.find((call) => call.method === 'wallet_addEthereumChain')
    const chain = (addCall?.params as Array<{ nativeCurrency: { decimals: number }; rpcUrls: string[] }>)[0]
    expect(chain.nativeCurrency.decimals).toBe(18)
    expect(chain.rpcUrls).toEqual(ARC_TESTNET.rpcUrls)
    expect(calls.filter((call) => call.method === 'wallet_switchEthereumChain')).toHaveLength(2)
  })
})
