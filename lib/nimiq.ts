import { init } from '@nimiq/mini-app-sdk'

let nimiqPromise: ReturnType<typeof init> | null = null

export async function getNimiq() {
  if (!nimiqPromise) {
    nimiqPromise = init({ timeout: 10000 })
  }
  return nimiqPromise
}

function unwrap<T>(value: T | { error?: { message?: string } }, label: string): T {
  if (typeof value === 'object' && value !== null && 'error' in value) {
    const msg = (value as { error?: { message?: string } }).error?.message ?? `${label} failed`
    throw new Error(msg)
  }
  return value as T
}

export async function getAccounts() {
  const nimiq = await getNimiq()
  const res = await nimiq.listAccounts()
  return unwrap<string[]>(res, 'listAccounts')
}

export async function sendStakePayment(recipientAddress: string, amountNim: number, roundId: string) {
  const nimiq = await getNimiq()
  const amountLuna = Math.round(amountNim * 100000)
  const res = await nimiq.sendBasicTransactionWithData({
    recipient: recipientAddress,
    value: amountLuna,
    data: `round:${roundId}`,
  })
  return unwrap<string>(res, 'Stake payment rejected')
}

export async function sendPayoutPayment(recipientAddress: string, amountNim: number, roundId: string, place: string) {
  const nimiq = await getNimiq()
  const amountLuna = Math.round(amountNim * 100000)
  const res = await nimiq.sendBasicTransactionWithData({
    recipient: recipientAddress,
    value: amountLuna,
    data: `payout:${roundId}:${place}`,
  })
  return unwrap<string>(res, 'Payout rejected')
}

export function formatAddress(address: string): string {
  if (address.length <= 12) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}