'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

export default function Discover({
  rounds, loadingRounds, sdkState, address, error,
  onCreateClick, onRoundClick,
}: DiscoverProps) {
  const [greeting, setGreeting] = useState('Good morning, quizzer')
  const [tab, setTab] = useState<'live' | 'completed'>('live')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning, quizzer')
    else if (hour < 18) setGreeting('Good afternoon, quizzer')
    else setGreeting('Good evening, quizzer')
  }, [])

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-primary">{greeting}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-md">
            Put your knowledge <span className="text-primary">on the line.</span>
          </h1>
        </div>
        <Button onClick={onCreateClick} className="gap-2 rounded-full px-5 w-full sm:w-auto">
          <Plus className="size-4" /> Create round
        </Button>
      </div>

      {sdkState !== 'connected' && (
        <div className="rounded-lg bg-secondary/50 p-3 text-sm text-center">
          Open this app inside Nimiq Pay to join rounds with real test-NIM. Preview mode shows open rounds only.
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}

      <div>
        <div className="flex gap-2 mb-4">
          <Button 
            variant={tab === 'upcoming' ? 'default' : 'secondary'} 
            onClick={() => setTab('upcoming')}
            className="rounded-full px-5"
          >
            Upcoming
          </Button>
          <Button 
            variant={tab === 'live' ? 'default' : 'secondary'} 
            onClick={() => setTab('live')}
            className="rounded-full px-5"
          >
            Live
          </Button>
          <Button 
            variant={tab === 'completed' ? 'default' : 'secondary'} 
            onClick={() => setTab('completed')}
            className="rounded-full px-5"
          >
            Completed
          </Button>
        </div>
        
        {loadingRounds ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {(() => {
              const displayRounds = tab === 'upcoming'
                ? rounds.filter(r => r.status === 'OPEN')
                : tab === 'live'
                ? rounds.filter(r => r.status === 'IN_PROGRESS' || r.status === 'SCORING')
                : rounds.filter(r => r.status === 'COMPLETED' || r.status === 'AWAITING_PAYOUT')
              
              if (displayRounds.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {tab === 'upcoming' ? 'No upcoming rounds right now. Create one!' : 
                     tab === 'live' ? 'No live games happening right now.' : 
                     'No completed rounds yet.'}
                  </p>
                )
              }
              
              return displayRounds.map((r) => {
                const isMyRound = !!(address && r.host?.nimiqAddress === address)
              return (
                <article
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border bg-card p-4 transition hover:border-primary/50 active:bg-secondary/50"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded bg-muted px-2 py-1 font-mono text-[10px] font-medium">{r.category}</span>
                      {isMyRound && <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">Your round</span>}
                    </div>
                    <h3 className="mt-2 font-semibold truncate">{r.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {r.confirmedEntries ?? 0}/{r.maxPlayers} players · {Number(r.stakeAmount)} NIM stake · {r.questionCount} Qs
                    </p>
                  </div>
                  <Button
                    onClick={() => onRoundClick(r, isMyRound)}
                    variant={r.status === 'COMPLETED' ? 'outline' : 'default'}
                    className="w-full sm:w-auto"
                  >
                    {r.status === 'COMPLETED' ? 'Results' : (isMyRound ? 'Manage' : 'View')} <ChevronRight className="ml-1 size-4" />
                  </Button>
                </article>
              )
            })
          })()}
          </div>
        )}
      </div>
    </div>
  )
}
