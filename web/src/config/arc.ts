export const ARC_TESTNET = {
  chainId: 5_042_002,
  chainIdHex: `0x${(5_042_002).toString(16)}`,
  name: 'Arc Testnet',
  rpcUrl: 'https://rpc.testnet.arc.io',
  rpcUrls: [
    'https://rpc.testnet.arc.io',
    'https://rpc.drpc.testnet.arc.io',
    'https://rpc.quicknode.testnet.arc.io',
  ],
  explorerUrl: 'https://testnet.arcscan.app',
  usdcAddress: '0x3600000000000000000000000000000000000000',
} as const

export const ARC_DEPLOYMENT = {
  factory: String(import.meta.env.VITE_ARC_FACTORY_ADDRESS ?? '0x9d86B15bFb272B7b6702b9B0dDB3EA2a30B29601'),
  market: String(import.meta.env.VITE_ARC_MARKET_ADDRESS ?? '0x6C61d4e599EdBD181DD815aFA83B3029b6AFFA42'),
} as const

export const hasArcDeployment = /^0x[a-fA-F0-9]{40}$/.test(ARC_DEPLOYMENT.factory)
  && /^0x[a-fA-F0-9]{40}$/.test(ARC_DEPLOYMENT.market)
