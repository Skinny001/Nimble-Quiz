'use client'

import Link from 'next/link'
import { Bell } from 'lucide-react'
import { formatAddress } from '@/lib/nimiq'

interface HeaderProps {
  address: string | null;
  sdkState: 'connecting' | 'connected' | 'browser';
  notificationCount: number;
  onNotificationsClick: () => void;
}

export default function Header({ address, sdkState, notificationCount, onNotificationsClick }: HeaderProps) {
  const short = address ? formatAddress(address) : null

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3" style={{ background: 'rgba(13,15,31,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(47,51,85,0.7)' }}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-85">
        <img src="/logo.png" alt="Nimble Quiz Logo" className="h-7 sm:h-8 w-auto object-contain" />
        <span className="text-sm font-bold tracking-tight sm:text-base">Nimble Quiz</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* SDK / Address badge */}
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-medium"
          style={{ background: 'rgba(37,40,71,0.8)', border: '1px solid rgba(47,51,85,0.8)' }}>
          <span className="relative flex size-1.5 shrink-0">
            <span className={`absolute inline-flex h-full w-full rounded-full ${sdkState === 'connected' ? 'animate-ping' : ''}`}
              style={{ background: sdkState === 'connected' ? '#21BCA5' : sdkState === 'browser' ? '#E9B213' : '#8B8FAD', opacity: 0.75 }} />
            <span className="relative inline-flex size-1.5 rounded-full"
              style={{ background: sdkState === 'connected' ? '#21BCA5' : sdkState === 'browser' ? '#E9B213' : '#8B8FAD' }} />
          </span>
          <span className="truncate max-w-[110px] sm:max-w-none" style={{ color: '#8B8FAD' }}>
            {sdkState === 'connecting' ? 'Connecting…' : short ?? 'Preview'}
          </span>
        </div>

        {/* Notifications bell */}
        <button
          onClick={onNotificationsClick}
          className="relative flex size-8 sm:size-9 items-center justify-center rounded-xl transition-all"
          style={{ background: 'rgba(37,40,71,0.8)', border: '1px solid rgba(47,51,85,0.8)' }}
          aria-label="Notifications"
        >
          <Bell className="size-4" style={{ color: '#8B8FAD' }} />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: '#E9B213', color: '#0D0F1F' }}>
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

