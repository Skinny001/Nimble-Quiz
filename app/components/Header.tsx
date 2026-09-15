'use client'

import { Bell, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'

interface HeaderProps {
  address: string | null;
  sdkState: 'connecting' | 'connected' | 'browser';
  onWalletClick: () => void;
  unreadNotifications?: number;
  onBellClick?: () => void;
}

export default function Header({ address, sdkState, onWalletClick, unreadNotifications = 0, onBellClick }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border pb-4 mb-4">
      <button onClick={() => window.location.href = '/'} className="flex items-center gap-3 text-left">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Zap className="size-5" fill="currentColor" />
        </span>
        <span>
          <span className="block font-mono text-sm font-bold tracking-tight">NIMBLE</span>
          <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">quiz protocol</span>
        </span>
      </button>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs">
          <span className={`size-2 rounded-full ${sdkState === 'connected' ? 'bg-primary' : 'bg-accent'}`} />
          {sdkState === 'connected'
            ? `Connected ${address ? formatAddress(address) : ''}`
            : sdkState === 'browser'
            ? 'Preview mode'
            : 'Connecting wallet'}
        </div>
        <button onClick={onBellClick} aria-label="Notifications" className="relative rounded-full border border-border p-2.5 text-muted-foreground hover:bg-muted">
          <Bell className="size-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </button>
        <button onClick={onWalletClick} className="flex items-center gap-2 rounded-full border border-border bg-card py-1.5 pl-1.5 pr-3 text-sm font-medium">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-[10px]">
            {address ? formatAddress(address).slice(0, 4) : '??'}
          </span>
          <span className="hidden sm:inline">{address ? formatAddress(address) : 'Wallet'}</span>
        </button>
      </div>
    </header>
  )
}
