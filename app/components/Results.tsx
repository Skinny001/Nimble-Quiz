'use client'

import { Trophy, Info, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'

interface ResultsProps {
  detail: any;
  leaderboard: any[];
  pot: number;
  userId: string | null;
  busy: boolean;
  error: string | null;
  onPayout: (payout: any) => void;
  onHistory: () => void;
}

export default function Results({
  detail,
  leaderboard,
  pot,
  userId,
  busy,
  error,
  onPayout,
  onHistory,
}: ResultsProps) {
  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Trophy className="size-7" />
      </div>
      <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wide text-primary">Round complete</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Final results</h1>
      <p className="mt-2 text-sm text-muted-foreground">Pot: {pot} NIM</p>

      <div className="mt-6 rounded-xl border bg-card p-4 sm:p-5 text-left">
        {leaderboard.map((l: any, i: number) => (
          <div key={l.playerId} className="flex items-center gap-3 border-t py-3">
            <span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
              {i + 1}
            </span>
            <span className="flex-1 text-sm">
              {l.player?.displayName ?? formatAddress(l.player?.nimiqAddress ?? l.playerId)}
            </span>
            <span className="font-mono text-sm text-primary">{l.correctCount} ✓</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2 rounded-xl bg-secondary/60 p-4 text-left text-sm">
        <Info className="size-4 shrink-0 text-primary" />
        <span>Host sends payouts via Nimiq Pay. Verified on-chain.</span>
      </div>

      {detail && detail.isHost && (detail.status === 'AWAITING_PAYOUT' || detail.status === 'COMPLETED') && detail.payouts && detail.payouts.length > 0 && (
        <div className="mt-4 rounded-xl border bg-card p-4 text-left">
          <h3 className="font-semibold text-sm mb-3">Pending Payouts</h3>
          <div className="flex flex-col gap-2">
            {detail.payouts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between bg-secondary/40 p-3 rounded-lg">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{p.recipient?.displayName ?? formatAddress(p.recipient?.nimiqAddress)}</span>
                  <span className="text-xs text-muted-foreground">{Number(p.amount)} NIM</span>
                </div>
                {p.status === 'CONFIRMED' ? (
                  <span className="text-xs font-bold text-primary">Paid ✓</span>
                ) : (
                  <Button disabled={busy} onClick={() => onPayout(p)} size="sm" className="h-8">
                    {busy ? 'Paying…' : 'Pay'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button onClick={onHistory} variant="outline" className="mt-4 h-12 w-full">
        View round history
      </Button>
    </div>
  )
}
