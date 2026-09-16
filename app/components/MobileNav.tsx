'use client'

import { Home, Plus, History, WalletMinimal } from 'lucide-react'

type View = 'discover' | 'create' | 'detail' | 'lobby' | 'play' | 'results' | 'history' | 'wallet'

interface MobileNavProps {
  view: View
  setView: (view: View) => void
}

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'discover', label: 'Discover', icon: Home },
  { id: 'create', label: 'Create', icon: Plus },
  { id: 'history', label: 'My Rounds', icon: History },
  { id: 'wallet', label: 'Wallet', icon: WalletMinimal },
]

export default function MobileNav({ view, setView }: MobileNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden"
      style={{
        background: 'rgba(13, 15, 31, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(47, 51, 85, 0.8)',
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.5)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2">
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = view === id || (id === 'discover' && (view === 'detail' || view === 'lobby' || view === 'play' || view === 'results'))
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-1 text-center transition-all duration-200"
            >
              {/* Active top line pill indicator */}
              {isActive && (
                <span
                  className="absolute -top-2 h-1 w-8 rounded-full transition-all duration-300"
                  style={{
                    background: 'linear-gradient(90deg, #E9B213, #EC991C)',
                    boxShadow: '0 0 10px rgba(233, 178, 19, 0.6)',
                  }}
                />
              )}

              {/* Icon Container with glowing active backdrop */}
              <div
                className="flex size-9 items-center justify-center rounded-xl transition-all duration-200"
                style={
                  isActive
                    ? {
                        background: 'rgba(233, 178, 19, 0.15)',
                        border: '1px solid rgba(233, 178, 19, 0.3)',
                        transform: 'translateY(-2px)',
                      }
                    : {
                        background: 'transparent',
                        border: '1px solid transparent',
                      }
                }
              >
                <Icon
                  className="size-5 transition-colors"
                  style={{ color: isActive ? '#E9B213' : '#8B8FAD' }}
                />
              </div>

              {/* Label */}
              <span
                className="text-[11px] font-semibold tracking-tight transition-colors"
                style={{ color: isActive ? '#E9B213' : '#8B8FAD' }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
