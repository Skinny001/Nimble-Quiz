'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronRight, Zap, Trophy, Users } from 'lucide-react'

type RoundListItem = {
  id: string; title: string; category: string; stakeAmount: number | string;
  questionCount: number; maxPlayers: number; status: string;
  confirmedEntries?: number; host?: { nimiqAddress: string; displayName?: string | null };
}

interface DiscoverProps {
  rounds: RoundListItem[];
  loadingRounds: boolean;
  sdkState: 'connecting' | 'connected' | 'browser';
  address: string | null;
  error: string | null;
  onCreateClick: () => void;
  onRoundClick: (round: RoundListItem, isHost: boolean) => void;
}

const tabs = ['live', 'upcoming', 'completed'] as const
const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  IN_PROGRESS: { bg: 'rgba(233,178,19,0.12)', text: '#E9B213', label: 'Live' },
  SCORING: { bg: 'rgba(233,178,19,0.12)', text: '#E9B213', label: 'Scoring' },
  OPEN: { bg: 'rgba(33,188,165,0.12)', text: '#21BCA5', label: 'Open' },
  COMPLETED: { bg: 'rgba(47,51,85,0.8)', text: '#8B8FAD', label: 'Done' },
  AWAITING_PAYOUT: { bg: 'rgba(236,153,28,0.12)', text: '#EC991C', label: 'Payout' },
}

export default function Discover({ rounds, loadingRounds, sdkState, address, error, onCreateClick, onRoundClick }: DiscoverProps) {
  const [greeting, setGreeting] = useState('Good morning, quizzer')
  const [tab, setTab] = useState<typeof tabs[number]>('live')

  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setGreeting('Good morning, quizzer')
    else if (h < 18) setGreeting('Good afternoon, quizzer')
    else setGreeting('Good evening, quizzer')
  }, [])

  const displayRounds = tab === 'live'
    ? rounds.filter(r => r.status === 'IN_PROGRESS' || r.status === 'SCORING')
    : tab === 'upcoming'
    ? rounds.filter(r => r.status === 'OPEN')
    : rounds.filter(r => r.status === 'COMPLETED' || r.status === 'AWAITING_PAYOUT')

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Put your knowledge{' '}
            <span style={{ background: 'linear-gradient(135deg,#E9B213,#EC991C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              on the line.
            </span>
          </h1>
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold btn-gold w-full sm:w-auto"
        >
          <Plus className="size-4" /> Create round
        </button>
      </div>

      {/* SDK banner */}
      {sdkState !== 'connected' && (
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(233,178,19,0.06)', border: '1px solid rgba(233,178,19,0.2)', color: '#8B8FAD' }}>
          <Zap className="size-4 shrink-0" style={{ color: '#E9B213' }} />
          Open inside <span className="font-semibold" style={{ color: '#E9B213' }}>Nimiq Pay</span> to stake and play. Preview mode active.
        </div>
      )}

      {error && (
        <p className="rounded-2xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>{error}</p>
      )}

      {/* Tabs */}
      <div>
        <div className="flex gap-1.5 mb-5">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all"
              style={tab === t
                ? { background: 'rgba(233,178,19,0.12)', border: '1px solid rgba(233,178,19,0.3)', color: '#E9B213' }
                : { background: '#1A1D35', border: '1px solid #2F3355', color: '#8B8FAD' }}
            >
              {t}
            </button>
          ))}
        </div>

        {loadingRounds ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayRounds.length === 0 ? (
              <div className="py-16 text-center">
                <Trophy className="mx-auto mb-3 size-10" style={{ color: '#2F3355' }} />
                <p className="text-sm" style={{ color: '#8B8FAD' }}>
                  {tab === 'live' ? 'No live games right now.' : tab === 'upcoming' ? 'No open rounds. Create one!' : 'No completed rounds yet.'}
                </p>
                {tab === 'upcoming' && (
                  <button onClick={onCreateClick} className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold btn-gold">
                    Create first round
                  </button>
                )}
              </div>
            ) : displayRounds.map((r) => {
              const isMyRound = !!(address && r.host?.nimiqAddress === address)
              const st = statusColors[r.status] ?? { bg: '#1A1D35', text: '#8B8FAD', label: r.status }
              return (
                <article
                  key={r.id}
                  className="card-3d flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl p-4 sm:p-5"
                  style={{ background: '#1A1D35', border: '1px solid #2F3355' }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: '#252847', color: '#8B8FAD' }}>{r.category}</span>
                      <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: st.bg, color: st.text }}>{st.label}</span>
                      {isMyRound && (
                        <span className="rounded-lg px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'rgba(233,178,19,0.1)', color: '#E9B213' }}>Your round</span>
                      )}
                    </div>
                    <h3 className="mt-2 font-semibold truncate">{r.title}</h3>
                    <div className="mt-1.5 flex items-center gap-3 text-xs" style={{ color: '#8B8FAD' }}>
                      <span className="flex items-center gap-1"><Users className="size-3" />{r.confirmedEntries ?? 0}/{r.maxPlayers}</span>
                      <span style={{ color: '#E9B213', fontWeight: 600 }}>{Number(r.stakeAmount)} NIM</span>
                      <span>{r.questionCount} Qs</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onRoundClick(r, isMyRound)}
                    className="flex w-full sm:w-auto items-center justify-center gap-1 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
                    style={r.status === 'COMPLETED'
                      ? { background: '#252847', border: '1px solid #2F3355', color: '#8B8FAD' }
                      : { background: 'linear-gradient(135deg,#E9B213,#EC991C)', color: '#0D0F1F' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
                  >
                    {r.status === 'COMPLETED' ? 'Results' : isMyRound ? 'Manage' : 'View'}
                    <ChevronRight className="size-4" />
                  </button>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
