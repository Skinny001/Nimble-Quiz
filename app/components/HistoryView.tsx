'use client'

import { Trophy, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'

type RoundListItem = {
  id: string; title: string; category: string; stakeAmount: number | string;
  questionCount: number; maxPlayers: number; status: string;
  confirmedEntries?: number; host?: { nimiqAddress: string; displayName?: string | null };
}

interface HistoryViewProps {
  rounds: RoundListItem[];
  address: string | null;
}

export default function HistoryView({ rounds, address }: HistoryViewProps) {
  const hostedRounds = rounds.filter((r: any) => r.host?.nimiqAddress === address)

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      <div className="mb-6">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-primary">Your activity</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">My rounds</h1>
        <p className="mt-2 text-sm text-muted-foreground">A transparent record of every game, stake, and payout.</p>
      </div>

      <div className="flex flex-col gap-3">
        {hostedRounds.map((r) => (
          <button
            key={r.id}
            onClick={() => alert(`View details for ${r.title}`)}
            className="rounded-xl border bg-card p-4 sm:p-5 text-left hover:border-primary/50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Trophy className="size-5" />
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold truncate">{r.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground truncate">
                  {r.status} · {Number(r.stakeAmount)} NIM stake · {r.questionCount} Qs
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </button>
        ))}

        {hostedRounds.length === 0 && (
          <div className="rounded-xl border bg-secondary/50 p-8 text-center">
            <Trophy className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No rounds hosted yet.</p>
            <Button variant="outline" className="mt-4">Create your first round</Button>
          </div>
        )}
      </div>
    </div>
  )
}
