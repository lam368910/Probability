import { useCallback, useEffect, useRef, useState } from 'react'
import { ARC_DEPLOYMENT, ARC_TESTNET, hasArcDeployment } from '../config/arc'
import { formatUsdcUnits, hasGasBuffer, parseUsdcAmount } from '../lib/usdc'

const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function approve(address,uint256) returns (bool)',
]

const MARKET_ABI = [
  'function question() view returns (string)',
  'function yesReserve() view returns (uint256)',
  'function noReserve() view returns (uint256)',
  'function totalLpShares() view returns (uint256)',
  'function quoteBuy(bool,uint256) view returns (uint256 sharesOut,uint256 fee)',
  'function buy(bool,uint256,uint256,uint256) returns (uint256 sharesOut)',
  'function addLiquidity(uint256,uint256,uint256,uint256,uint256) returns (uint256,uint256,uint256)',
]

export interface EthereumProvider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>
  on?(event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void): void
  removeListener?(event: 'accountsChanged' | 'chainChanged', listener: (...args: unknown[]) => void): void
}

declare global {
  interface Window { ethereum?: EthereumProvider }
}

export interface ArcWallet {
  account: string
  balance: string
  marketQuestion: string
  reserves: string
  status: 'idle' | 'connecting' | 'ready' | 'pending' | 'error'
  message: string
  txHash: string
  deploymentReady: boolean
  deploymentConfigured: boolean
  networkReady: boolean
  connect(): Promise<void>
  refresh(): Promise<void>
  buyYes(amount: string): Promise<void>
  provideLiquidity(amount: string): Promise<void>
}

function errorCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const direct = (error as { code?: unknown }).code
  if (typeof direct === 'number') return direct
  if (typeof direct === 'string' && /^-?\d+$/.test(direct)) return Number(direct)
  const nested = (error as { error?: { code?: unknown } }).error?.code
  if (typeof nested === 'number') return nested
  return typeof nested === 'string' && /^-?\d+$/.test(nested) ? Number(nested) : undefined
}

function walletErrorMessage(error: unknown, fallback: string): string {
  const code = errorCode(error)
  if (code === 4001) return 'Request cancelled in the wallet.'
  if (code === -32002) return 'A wallet request is already open. Complete or dismiss it, then retry.'
  return error instanceof Error && error.message ? error.message : fallback
}

export async function switchToArc(ethereum: EthereumProvider): Promise<void> {
  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_TESTNET.chainIdHex }] })
  } catch (error) {
    if (errorCode(error) !== 4902) throw error
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: ARC_TESTNET.chainIdHex,
        chainName: ARC_TESTNET.name,
        nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
        rpcUrls: [...ARC_TESTNET.rpcUrls],
        blockExplorerUrls: [ARC_TESTNET.explorerUrl],
      }],
    })
    // EIP-3085 does not require every wallet to select a chain after adding it.
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: ARC_TESTNET.chainIdHex }] })
  }

  const selectedChain = String(await ethereum.request({ method: 'eth_chainId' })).toLowerCase()
  if (selectedChain !== ARC_TESTNET.chainIdHex.toLowerCase()) {
    throw new Error('Wallet did not switch to Arc Testnet.')
  }
}

const sameAddress = (left: string, right: string) => left.toLowerCase() === right.toLowerCase()
const withSlippage = (value: bigint) => value === 0n ? 0n : value * 99n / 100n

export function useArcWallet(): ArcWallet {
  const [account, setAccount] = useState('')
  const [balance, setBalance] = useState('—')
  const [marketQuestion, setMarketQuestion] = useState(hasArcDeployment ? 'Loading Arc market…' : 'Arc deployment pending')
  const [reserves, setReserves] = useState('—')
  const [deploymentVerified, setDeploymentVerified] = useState(false)
  const [networkReady, setNetworkReady] = useState(false)
  const [status, setStatus] = useState<ArcWallet['status']>('idle')
  const [message, setMessage] = useState('Connect an EVM wallet to use the Arc Testnet MVP.')
  const [txHash, setTxHash] = useState('')
  const refreshSequence = useRef(0)
  const operationInFlight = useRef(false)

  const loadState = useCallback(async (address: string, provider: import('ethers').Provider) => {
    const requestId = ++refreshSequence.current
    const { Contract } = await import('ethers')
    const usdc = new Contract(ARC_TESTNET.usdcAddress, USDC_ABI, provider)
    const market = hasArcDeployment ? new Contract(ARC_DEPLOYMENT.market, MARKET_ABI, provider) : null
    const [usdcBalance, marketState] = await Promise.all([
      usdc.balanceOf(address) as Promise<bigint>,
      market
        ? Promise.all([
            market.question() as Promise<string>,
            market.yesReserve() as Promise<bigint>,
            market.noReserve() as Promise<bigint>,
          ])
        : Promise.resolve(null),
    ])
    if (requestId !== refreshSequence.current) return

    setBalance(`${formatUsdcUnits(usdcBalance)} USDC`)
    if (marketState) {
      setDeploymentVerified(true)
      setMarketQuestion(marketState[0] || 'Unnamed Arc market')
      setReserves(`${formatUsdcUnits(marketState[1])} / ${formatUsdcUnits(marketState[2])} USDC`)
    }
  }, [])

  const loadPublicMarket = useCallback(async () => {
    if (!hasArcDeployment) return
    const requestId = ++refreshSequence.current
    const { Contract, JsonRpcProvider } = await import('ethers')
    for (const rpcUrl of ARC_TESTNET.rpcUrls) {
      try {
        const provider = new JsonRpcProvider(rpcUrl, ARC_TESTNET.chainId, { staticNetwork: true })
        const market = new Contract(ARC_DEPLOYMENT.market, MARKET_ABI, provider)
        const [question, yesReserve, noReserve] = await Promise.all([
          market.question() as Promise<string>,
          market.yesReserve() as Promise<bigint>,
          market.noReserve() as Promise<bigint>,
        ])
        if (requestId !== refreshSequence.current) return
        setDeploymentVerified(true)
        setMarketQuestion(question || 'Unnamed Arc market')
        setReserves(`${formatUsdcUnits(yesReserve)} / ${formatUsdcUnits(noReserve)} USDC`)
        return
      } catch {
        // Public RPC endpoints can rate-limit independently; try the next official endpoint.
      }
    }
    if (requestId !== refreshSequence.current) return
    setDeploymentVerified(false)
    setMarketQuestion('Arc market unavailable')
    setReserves('Unavailable')
  }, [])

  const syncWallet = useCallback(async (address: string) => {
    if (!window.ethereum) return
    const chainId = String(await window.ethereum.request({ method: 'eth_chainId' })).toLowerCase()
    const onArc = chainId === ARC_TESTNET.chainIdHex.toLowerCase()
    setAccount(address)
    setNetworkReady(onArc)
    if (!onArc) {
      ++refreshSequence.current
      setBalance('—')
      setStatus('idle')
      setMessage('Wallet connected on another network. Switch to Arc Testnet before signing.')
      await loadPublicMarket()
      return
    }

    const { BrowserProvider } = await import('ethers')
    try {
      await loadState(address, new BrowserProvider(window.ethereum, 'any'))
    } catch (error) {
      if (hasArcDeployment) setDeploymentVerified(false)
      throw error
    }
    if (!operationInFlight.current) {
      setStatus('ready')
      setMessage(hasArcDeployment ? 'Arc Testnet connected. Onchain state is current.' : 'Wallet connected; contract deployment is not configured yet.')
    }
  }, [loadPublicMarket, loadState])

  const refresh = useCallback(async () => {
    if (!window.ethereum || !account) {
      await loadPublicMarket()
      return
    }
    setMessage('Refreshing Arc state…')
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
      if (!accounts[0]) {
        ++refreshSequence.current
        setAccount('')
        setBalance('—')
        setNetworkReady(false)
        setStatus('idle')
        setMessage('Wallet disconnected. Connect again to submit an Arc transaction.')
        await loadPublicMarket()
        return
      }
      await syncWallet(accounts[0])
    } catch (error) {
      setStatus('error')
      setMessage(walletErrorMessage(error, 'Could not refresh Arc state'))
    }
  }, [account, loadPublicMarket, syncWallet])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setStatus('error')
      setMessage('Install MetaMask, Rabby, Coinbase Wallet, or another EIP-1193 wallet.')
      return
    }
    setStatus('connecting')
    setMessage('Requesting wallet access and Arc Testnet…')
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }) as string[]
      const address = accounts[0]
      if (!address) throw new Error('No wallet account returned')
      await switchToArc(window.ethereum)
      await syncWallet(address)
    } catch (error) {
      setStatus('error')
      setMessage(walletErrorMessage(error, 'Wallet connection failed'))
    }
  }, [syncWallet])

  useEffect(() => {
    const ethereum = window.ethereum
    void loadPublicMarket()
    if (!ethereum) return () => { ++refreshSequence.current }

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0].filter((item): item is string => typeof item === 'string') : []
      if (!accounts[0]) {
        ++refreshSequence.current
        setAccount('')
        setBalance('—')
        setNetworkReady(false)
        setStatus('idle')
        setMessage('Wallet disconnected. Connect again to submit an Arc transaction.')
        void loadPublicMarket()
        return
      }
      void syncWallet(accounts[0]).catch((error: unknown) => {
        setStatus('error')
        setMessage(walletErrorMessage(error, 'Could not load the selected account'))
      })
    }
    const handleChainChanged = () => {
      void (async () => {
        const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[]
        if (accounts[0]) await syncWallet(accounts[0])
        else {
          ++refreshSequence.current
          setNetworkReady(false)
          setBalance('—')
          await loadPublicMarket()
        }
      })().catch((error: unknown) => {
        setStatus('error')
        setMessage(walletErrorMessage(error, 'Could not update the selected network'))
      })
    }

    ethereum.on?.('accountsChanged', handleAccountsChanged)
    ethereum.on?.('chainChanged', handleChainChanged)
    void (async () => {
      const accounts = await ethereum.request({ method: 'eth_accounts' }) as string[]
      if (accounts[0]) await syncWallet(accounts[0])
    })().catch(() => undefined)

    return () => {
      ++refreshSequence.current
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged)
      ethereum.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [loadPublicMarket, syncWallet])

  const execute = useCallback(async (kind: 'buy' | 'liquidity', amount: string) => {
    const parsed = parseUsdcAmount(amount)
    if (operationInFlight.current) return
    if (!window.ethereum || !account || !hasArcDeployment || !deploymentVerified) {
      setStatus('error')
      setMessage('Connect a wallet after the Arc deployment is configured.')
      return
    }
    if (!parsed) {
      setStatus('error')
      setMessage('Enter a positive USDC amount with no more than 6 decimals.')
      return
    }

    operationInFlight.current = true
    setStatus('pending')
    setTxHash('')
    setMessage('Verifying Arc network, account, and USDC balance…')
    try {
      await switchToArc(window.ethereum)
      const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[]
      const currentAddress = accounts[0]
      if (!currentAddress) throw new Error('Wallet disconnected before signing.')
      if (!sameAddress(currentAddress, account)) {
        await syncWallet(currentAddress)
        setStatus('ready')
        setMessage('Wallet account changed. Review the refreshed balance and submit again.')
        return
      }

      const { BrowserProvider, Contract } = await import('ethers')
      const provider = new BrowserProvider(window.ethereum, 'any')
      const signer = await provider.getSigner()
      const signerAddress = await signer.getAddress()
      if (!sameAddress(signerAddress, currentAddress)) throw new Error('Wallet account changed before signing. Please retry.')

      const usdc = new Contract(ARC_TESTNET.usdcAddress, USDC_ABI, signer)
      const market = new Contract(ARC_DEPLOYMENT.market, MARKET_ABI, signer)
      const [usdcBalance, allowance] = await Promise.all([
        usdc.balanceOf(currentAddress) as Promise<bigint>,
        usdc.allowance(currentAddress, ARC_DEPLOYMENT.market) as Promise<bigint>,
      ])
      if (!hasGasBuffer(usdcBalance, parsed.units)) {
        throw new Error('Insufficient USDC. Keep at least 0.01 USDC available for Arc gas.')
      }

      if (allowance < parsed.units) {
        setMessage('Approve the market to spend this exact USDC amount…')
        const approveTx = await usdc.approve(ARC_DEPLOYMENT.market, parsed.units)
        setTxHash(approveTx.hash)
        await approveTx.wait(1)
      }

      const deadline = Math.floor(Date.now() / 1000) + 600
      let transaction: { hash: string; wait(confirmations?: number): Promise<unknown> }
      if (kind === 'buy') {
        setMessage('Approval ready. Confirm the YES purchase in your wallet…')
        const [sharesOut] = await market.quoteBuy(true, parsed.units) as [bigint, bigint]
        if (sharesOut === 0n) throw new Error('The onchain quote returns zero YES shares.')
        transaction = await market.buy(true, parsed.units, withSlippage(sharesOut), deadline)
      } else {
        setMessage('Approval ready. Confirm the liquidity deposit in your wallet…')
        const [yesReserve, noReserve, totalLpShares] = await Promise.all([
          market.yesReserve() as Promise<bigint>,
          market.noReserve() as Promise<bigint>,
          market.totalLpShares() as Promise<bigint>,
        ])
        const largestReserve = yesReserve > noReserve ? yesReserve : noReserve
        if (largestReserve === 0n || totalLpShares === 0n) throw new Error('The Arc pool is not initialized.')
        const lpShares = parsed.units * totalLpShares / largestReserve
        if (lpShares === 0n) throw new Error('Amount is too small to mint an LP share.')
        const yesReturned = parsed.units - yesReserve * lpShares / totalLpShares
        const noReturned = parsed.units - noReserve * lpShares / totalLpShares
        transaction = await market.addLiquidity(
          parsed.units,
          withSlippage(lpShares),
          withSlippage(yesReturned),
          withSlippage(noReturned),
          deadline,
        )
      }
      setTxHash(transaction.hash)
      setMessage('Transaction submitted. Waiting for Arc finality…')
      await transaction.wait(1)
      await loadState(currentAddress, provider)
      setNetworkReady(true)
      setStatus('ready')
      setMessage('Final on Arc. Balance and pool reserves have been refreshed.')
    } catch (error) {
      setStatus('error')
      setMessage(walletErrorMessage(error, 'Arc transaction failed'))
    } finally {
      operationInFlight.current = false
    }
  }, [account, deploymentVerified, loadState, syncWallet])

  return {
    account,
    balance,
    marketQuestion,
    reserves,
    status,
    message,
    txHash,
    deploymentReady: hasArcDeployment && deploymentVerified,
    deploymentConfigured: hasArcDeployment,
    networkReady,
    connect,
    refresh,
    buyYes: (amount) => execute('buy', amount),
    provideLiquidity: (amount) => execute('liquidity', amount),
  }
}
