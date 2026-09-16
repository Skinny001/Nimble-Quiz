'use client'

import { Trophy, ChevronLeft, Users } from 'lucide-react'
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

const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
  COMPLETED: { label: 'Completed', color: '#21BCA5', bg: 'rgba(33,188,165,0.12)' },
  AWAITING_PAYOUT: { label: 'Awaiting Payout', color: '#EC991C', bg: 'rgba(236,153,28,0.12)' },
  SCORING: { label: 'Scoring', color: '#E9B213', bg: 'rgba(233,178,19,0.12)' },
  IN_PROGRESS: { label: 'In Progress', color: '#E9B213', bg: 'rgba(233,178,19,0.12)' },
  OPEN: { label: 'Open', color: '#8B8FAD', bg: 'rgba(37,40,71,0.8)' },
}

export default function HistoryView({ rounds, address, onBack }: HistoryViewProps) {
  const hostedRounds = rounds.filter((r: any) => r.host?.nimiqAddress === address)
  const joinedRounds = rounds.filter((r: any) => r.host?.nimiqAddress !== address)

  const RoundCard = ({ r, role }: { r: RoundListItem; role: 'host' | 'player' }) => {
    const st = statusLabel[r.status] ?? { label: r.status, color: '#8B8FAD', bg: '#252847' }
    return (
      <div className="card-3d rounded-2xl p-4 sm:p-5 text-left" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
        <div className="flex items-center gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: role === 'host' ? 'rgba(233,178,19,0.12)' : 'rgba(33,188,165,0.12)', color: role === 'host' ? '#E9B213' : '#21BCA5' }}
          >
            {role === 'host' ? <Trophy className="size-5" /> : <Users className="size-5" />}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold truncate text-sm sm:text-base">{r.title}</h2>
              <span className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: '#252847', color: '#8B8FAD' }}>
                {role === 'host' ? 'Host' : 'Player'}
              </span>
            </div>
            <p className="mt-1 text-xs truncate" style={{ color: '#8B8FAD' }}>
              {r.category} · <span style={{ color: '#E9B213', fontWeight: 600 }}>{Number(r.stakeAmount)} NIM</span> · {r.questionCount} Qs
            </p>
          </div>
          <span
            className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ background: st.bg, color: st.color }}
          >
            {st.label}
          </span>
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
        className="mb-4 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#8B8FAD' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0F2FF'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8B8FAD'}
      >
        <ChevronLeft className="size-4" />
        Back to discover
      </button>

      <div className="mb-6">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>Your activity</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">My rounds</h1>
        <p className="mt-1.5 text-sm" style={{ color: '#8B8FAD' }}>A transparent record of every game, stake, and payout.</p>
      </div>

      {allEmpty && (
        <div className="rounded-2xl p-8 text-center" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
          <Trophy className="mx-auto size-10" style={{ color: '#2F3355' }} />
          <p className="mt-3 text-sm" style={{ color: '#8B8FAD' }}>No rounds yet. Create or join one!</p>
          <button onClick={onBack} className="mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold btn-gold">
            Browse rounds
          </button>
        </div>
      )}

      {hostedRounds.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#8B8FAD' }}>Hosted by me</p>
          <div className="flex flex-col gap-3">
            {hostedRounds.map((r) => <RoundCard key={r.id} r={r} role="host" />)}
          </div>
        </div>
      )}

      {joinedRounds.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#8B8FAD' }}>Joined as player</p>
          <div className="flex flex-col gap-3">
            {joinedRounds.map((r) => <RoundCard key={r.id} r={r} role="player" />)}
          </div>
        </div>
      )}
    </div>
  )
}
