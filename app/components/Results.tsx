'use client'

import { Trophy, Info, ChevronLeft, Zap } from 'lucide-react'
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
  onPayAll: () => void;
  payAllProgress: { current: number; total: number } | null;
  onHistory: () => void;
  onBack: () => void;
}

export default function Results({
  detail,
  leaderboard,
  pot,
  userId,
  busy,
  error,
  onPayout,
  onPayAll,
  payAllProgress,
  onHistory,
  onBack,
}: ResultsProps) {
  const pendingPayouts = (detail?.payouts ?? []).filter((p: any) => p.status !== 'CONFIRMED')
  const confirmedPayouts = (detail?.payouts ?? []).filter((p: any) => p.status === 'CONFIRMED')
  const showPayouts =
    detail &&
    detail.isHost &&
    (detail.status === 'AWAITING_PAYOUT' || detail.status === 'COMPLETED') &&
    detail.payouts &&
    detail.payouts.length > 0

  const isZeroScore = leaderboard.length > 0 && leaderboard.every((l: any) => l.correctCount === 0)

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

      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Trophy className="size-7" />
        </div>
        <p className="mt-4 font-mono text-xs font-bold uppercase tracking-wide text-primary">Round complete</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">Final results</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pot: {pot} NIM</p>
        {isZeroScore && (
          <p className="mt-1 text-sm text-yellow-500 font-medium">No one scored — stakes returned to all players</p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="mt-6 rounded-xl border bg-card p-4 sm:p-5 text-left">
        {leaderboard.map((l: any, i: number) => (
          <div key={l.playerId} className="flex items-center gap-3 border-t py-3 first:border-t-0">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${
                i === 0 && l.correctCount > 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
              }`}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-sm">
              {l.player?.displayName ?? formatAddress(l.player?.nimiqAddress ?? l.playerId)}
              {l.playerId === userId && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
            </span>
            <span className="font-mono text-sm text-primary">{l.correctCount} ✓</span>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="mt-4 flex gap-2 rounded-xl bg-secondary/60 p-4 text-left text-sm">
        <Info className="size-4 shrink-0 text-primary" />
        <span>Host sends payouts via Nimiq Pay. Each payment is verified on-chain.</span>
      </div>

      {/* Payout section — host only */}
      {showPayouts && (
        <div className="mt-4 rounded-xl border bg-card p-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">
              {isZeroScore ? 'Refunds' : 'Payouts'}{' '}
              <span className="text-muted-foreground font-normal">
                ({confirmedPayouts.length}/{detail.payouts.length} paid)
              </span>
            </h3>

            {/* Pay All button — only when 2+ are pending */}
            {pendingPayouts.length >= 2 && (
              <Button
                disabled={busy}
                onClick={onPayAll}
                size="sm"
                className="h-8 gap-1.5"
              >
                <Zap className="size-3.5" />
                {payAllProgress
                  ? `Paying ${payAllProgress.current}/${payAllProgress.total}…`
                  : `Pay All (${pendingPayouts.length})`}
              </Button>
            )}
          </div>

          {/* Progress bar during Pay All */}
          {payAllProgress && (
            <div className="mb-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(payAllProgress.current / payAllProgress.total) * 100}%` }}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {detail.payouts.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-secondary/40 p-3 rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {p.recipient?.displayName ?? formatAddress(p.recipient?.nimiqAddress)}
                  </span>
                  <span className="text-xs text-muted-foreground">{Number(p.amount)} NIM</span>
                </div>
                {p.status === 'CONFIRMED' ? (
                  <span className="text-xs font-bold text-primary">Paid ✓</span>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() => onPayout(p)}
                    size="sm"
                    variant="outline"
                    className="h-8"
                  >
                    {busy && !payAllProgress ? 'Paying…' : 'Pay'}
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
