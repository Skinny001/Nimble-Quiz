// Single source of truth for which Nimiq network the app talks to.
// This project runs on TESTNET. Override via env, never hardcode mainnet.

export const NIMIQ_NETWORK =
  process.env.NIMIQ_NETWORK ?? process.env.NEXT_PUBLIC_NIMIQ_NETWORK ?? 'testnet'

export const IS_TESTNET = NIMIQ_NETWORK.toLowerCase() !== 'mainnet'

// Base URL of a Nimiq node / indexer you control (or a public testnet endpoint).
// No mainnet fallback on purpose: misconfigured env must fail loudly,
// not silently verify against the wrong chain.
export function rpcBase(): string {
  const base = process.env.NIMIQ_RPC_URL
  if (!base) {
    throw new Error(
      'NIMIQ_RPC_URL is not set. Point it at your testnet node/indexer ' +
        '(e.g. your own Nimiq testnet node REST endpoint).'
    )
  }
  return base.replace(/\/$/, '')
}

export function txUrl(hash: string): string {
  return `${rpcBase()}/tx/${hash}`
}

export function addressTxsUrl(address: string, limit = 100): string {
  return `${rpcBase()}/address/${address}/transactions?limit=${limit}`
}

// Public explorer links shown in the UI (testnet by default).
export function explorerTxUrl(hash: string): string {
  const base =
    process.env.NEXT_PUBLIC_NIMIQ_EXPLORER ?? 'https://testnet.nimiqscan.com/tx'
  return `${base.replace(/\/$/, '')}/${hash}`
}
