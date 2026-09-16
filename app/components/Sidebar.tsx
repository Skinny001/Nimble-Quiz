'use client'

import { Home, Plus, History, WalletMinimal, ShieldCheck } from 'lucide-react'

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
    <aside className="hidden w-52 shrink-0 lg:block">
      <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8B8FAD' }}>Menu</p>
      <nav className="flex flex-col gap-1">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all"
            style={view === id
              ? { background: 'rgba(233,178,19,0.12)', color: '#E9B213', border: '1px solid rgba(233,178,19,0.25)' }
              : { color: '#8B8FAD', border: '1px solid transparent' }
            }
            onMouseEnter={e => { if (view !== id) { (e.currentTarget as HTMLElement).style.background = 'rgba(37,40,71,0.8)'; (e.currentTarget as HTMLElement).style.color = '#F0F2FF' } }}
            onMouseLeave={e => { if (view !== id) { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = '#8B8FAD' } }}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Trust badge */}
      <div className="mt-8 rounded-xl p-4" style={{ background: 'rgba(33,188,165,0.06)', border: '1px solid rgba(33,188,165,0.2)' }}>
        <ShieldCheck className="mb-2 size-5" style={{ color: '#21BCA5' }} />
        <p className="text-xs font-semibold" style={{ color: '#F0F2FF' }}>Trust by design</p>
        <p className="mt-1 text-xs leading-5" style={{ color: '#8B8FAD' }}>Every stake and payout is verifiable on-chain.</p>
      </div>
    </aside>
  )
}
