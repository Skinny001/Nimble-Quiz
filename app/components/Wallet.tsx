'use client'

import { useState, useEffect } from 'react'
import { WalletCards, ArrowUpRight, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'

interface WalletProps {
  address: string | null;
  userId: string | null;
  sdkState: 'connecting' | 'connected' | 'browser';
  error: string | null;
}

export default function Wallet({ address, userId, sdkState, error }: WalletProps) {
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!address) return
    
    let active = true
    fetch(`/api/v1/wallet/balance/${address}`)
    .then(res => res.json())
    .then(data => {
      if (!active) return
      if (typeof data.balance === 'number') {
        setBalance(data.balance)
      } else {
        setBalance(0)
      }
    })
    .catch(err => console.error('Failed to fetch balance', err))

    return () => { active = false }
  }, [address])
  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      <div className="mb-6">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-primary">Nimiq Pay</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Your wallet</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage your connected account and on-chain activity.</p>
      </div>

      <div className="rounded-2xl bg-primary p-4 sm:p-6 text-primary-foreground">
        <div className="mb-6 flex items-start justify-between">
          <WalletCards className="size-6" />
          <span className="rounded-full bg-primary-foreground/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider">Your wallet</span>
        </div>
        <p className="mb-1 text-sm opacity-70">Available balance</p>
        <p className="font-mono text-3xl sm:text-4xl font-bold tracking-[-0.06em]">
          {balance !== null ? balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 5 }) : '—'} <span className="text-lg">NIM</span>
        </p>
        <div className="mt-4 flex items-center justify-between border-t border-primary-foreground/20 pt-4 text-xs">
          <span className="opacity-70">{address ? formatAddress(address) : 'Not connected'}</span>
          <span className="flex items-center gap-1">
            {sdkState === 'connected' ? (
              <>Connected <span className="size-1.5 rounded-full bg-primary-foreground" /></>
            ) : (
              <>Preview <span className="size-1.5 rounded-full bg-accent" /></>
            )}
          </span>
        </div>
      </div>

      {sdkState !== 'connected' && (
        <Button
          onClick={() => alert('Open this app inside Nimiq Pay to connect your wallet.')}
          className="mt-4 w-full"
        >
          Connect wallet (open in Nimiq Pay)
        </Button>
      )}

      {error && <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 rounded-xl border bg-card p-4 sm:p-6 text-sm">
        <p><span className="text-muted-foreground">Address:</span> <span className="ml-2 font-mono">{address ?? '—'}</span></p>
        <p className="mt-2"><span className="text-muted-foreground">User ID:</span> <span className="ml-2 font-mono">{userId ?? '—'}</span></p>
      </div>
    </div>
  )
}
