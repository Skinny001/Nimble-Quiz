'use client'

import { Home, Plus, History, WalletMinimal, ShieldCheck, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

type View = 'discover' | 'create' | 'detail' | 'lobby' | 'play' | 'results' | 'history' | 'wallet'

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
}

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'discover', label: 'Discover', icon: Home },
  { id: 'create', label: 'Create round', icon: Plus },
  { id: 'history', label: 'My rounds', icon: History },
  { id: 'wallet', label: 'Wallet', icon: WalletMinimal },
]

export default function Sidebar({ view, setView }: SidebarProps) {
  return (
    <aside className="hidden w-48 shrink-0 lg:block">
      <p className="mb-4 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Workspace</p>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              view === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-10 rounded-xl border border-border bg-secondary/50 p-4">
        <ShieldCheck className="mb-3 size-5 text-primary" />
        <p className="text-xs font-semibold">Trust by design</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Every stake and payout is verifiable on-chain.</p>
      </div>
    </aside>
  )
}
