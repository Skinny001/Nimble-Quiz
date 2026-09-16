'use client'

import { Trophy, ChevronLeft, Zap, Users } from 'lucide-react'
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
  onBack: () => void;
}

const statusLabel: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: 'Completed', color: 'text-green-500' },
  AWAITING_PAYOUT: { label: 'Awaiting Payout', color: 'text-yellow-500' },
  SCORING: { label: 'Scoring', color: 'text-blue-400' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-primary' },
  OPEN: { label: 'Open', color: 'text-muted-foreground' },
}

export default function HistoryView({ rounds, address, onBack }: HistoryViewProps) {
  const hostedRounds = rounds.filter((r: any) => r.host?.nimiqAddress === address)
  const joinedRounds = rounds.filter((r: any) => r.host?.nimiqAddress !== address)

  const RoundCard = ({ r, role }: { r: RoundListItem; role: 'host' | 'player' }) => {
    const st = statusLabel[r.status] ?? { label: r.status, color: 'text-muted-foreground' }
    return (
      <div className="rounded-xl border bg-card p-4 sm:p-5 text-left">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {role === 'host' ? <Trophy className="size-5" /> : <Users className="size-5" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold truncate">{r.title}</h2>
              <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                {role === 'host' ? 'Host' : 'Player'}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {r.category} · {Number(r.stakeAmount)} NIM · {r.questionCount} Qs
            </p>
          </div>
          <span className={`shrink-0 text-xs font-semibold ${st.color}`}>{st.label}</span>
        </div>
      </div>
    )
  }

  const allEmpty = hostedRounds.length === 0 && joinedRounds.length === 0

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to discover
      </button>

      <div className="mb-6">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-primary">Your activity</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">My rounds</h1>
        <p className="mt-2 text-sm text-muted-foreground">A transparent record of every game, stake, and payout.</p>
      </div>

      {allEmpty && (
        <div className="rounded-xl border bg-secondary/50 p-8 text-center">
          <Trophy className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No rounds yet. Create or join one!</p>
          <Button variant="outline" className="mt-4" onClick={onBack}>Browse rounds</Button>
        </div>
      )}

      {hostedRounds.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hosted by me</p>
          <div className="flex flex-col gap-3">
            {hostedRounds.map((r) => <RoundCard key={r.id} r={r} role="host" />)}
          </div>
        </div>
      )}

      {joinedRounds.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined as player</p>
          <div className="flex flex-col gap-3">
            {joinedRounds.map((r) => <RoundCard key={r.id} r={r} role="player" />)}
          </div>
        </div>
      )}
    </div>
  )
}
