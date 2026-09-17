'use client'

import { useState, useEffect } from 'react'
import { WalletCards, Shield, Info } from 'lucide-react'
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

    const loadBalance = () => {
      fetch(`/api/v1/wallet/balance/${address}`)
        .then((res) => res.json())
        .then((data) => {
          if (active) setBalance(typeof data.balance === 'number' ? data.balance : 0)
        })
        .catch(() => {})
    }

    loadBalance()
    const interval = setInterval(loadBalance, 3000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [address])

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      <div className="mb-6">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>Nimiq Pay</p>
        <h1 className="text-3xl font-bold sm:text-4xl">Your wallet</h1>
        <p className="mt-2 text-sm" style={{ color: '#8B8FAD' }}>Your connected Nimiq account and balance.</p>
      </div>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl p-6 gold-glow"
        style={{ background: 'linear-gradient(135deg, #1A1D35 0%, #252847 60%, rgba(233,178,19,0.08) 100%)', border: '1px solid rgba(233,178,19,0.3)' }}>
        {/* Decorative orb */}
        <div className="absolute -right-12 -top-12 size-48 rounded-full" style={{ background: 'radial-gradient(circle, rgba(233,178,19,0.08) 0%, transparent 70%)' }} />

        <div className="relative">
          <div className="mb-5 flex items-start justify-between">
            <WalletCards className="size-7" style={{ color: '#E9B213' }} />
            <span className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest"
              style={{ background: 'rgba(233,178,19,0.1)', color: '#E9B213' }}>Nimiq Wallet</span>
          </div>

          <p className="mb-1 text-xs font-medium" style={{ color: '#8B8FAD' }}>Available balance</p>
          <p className="font-mono text-4xl font-bold tracking-tight" style={{ color: '#F0F2FF' }}>
            {balance !== null
              ? balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 5 })
              : <span className="shimmer inline-block w-24 h-9 rounded-lg" />}
            {balance !== null && <span className="ml-2 text-xl font-medium" style={{ color: '#8B8FAD' }}>NIM</span>}
          </p>

          <div className="mt-5 flex items-center justify-between pt-4" style={{ borderTop: '1px solid rgba(47,51,85,0.8)' }}>
            <span className="font-mono text-xs" style={{ color: '#8B8FAD' }}>
              {address ? formatAddress(address) : 'Not connected'}
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <span className="relative flex size-1.5">
                {sdkState === 'connected' && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: '#21BCA5' }} />}
                <span className="relative inline-flex size-1.5 rounded-full" style={{ background: sdkState === 'connected' ? '#21BCA5' : '#E9B213' }} />
              </span>
              <span style={{ color: sdkState === 'connected' ? '#21BCA5' : '#E9B213' }}>
                {sdkState === 'connected' ? 'Connected' : 'Preview'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {sdkState !== 'connected' && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl p-4 text-sm"
          style={{ background: 'rgba(233,178,19,0.06)', border: '1px solid rgba(233,178,19,0.2)' }}>
          <Info className="size-4 shrink-0" style={{ color: '#E9B213' }} />
          <p style={{ color: '#8B8FAD' }}>Open this app inside <span style={{ color: '#E9B213' }}>Nimiq Pay</span> to connect your wallet and play with real NIM.</p>
        </div>
      )}

      {error && <p className="mt-3 rounded-xl p-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>{error}</p>}

      {/* Account details */}
      <div className="mt-5 rounded-2xl p-4 sm:p-5" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-4" style={{ color: '#21BCA5' }} />
          <p className="text-sm font-semibold">Account details</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <span style={{ color: '#8B8FAD' }}>Address</span>
            <span className="font-mono text-xs text-right break-all" style={{ color: '#F0F2FF', maxWidth: '65%' }}>{address ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between" style={{ borderTop: '1px solid #2F3355', paddingTop: '12px' }}>
            <span style={{ color: '#8B8FAD' }}>User ID</span>
            <span className="font-mono text-xs" style={{ color: '#8B8FAD' }}>{userId?.slice(0, 12) ?? '—'}…</span>
          </div>
        </div>
      </div>
    </div>
  )
}
