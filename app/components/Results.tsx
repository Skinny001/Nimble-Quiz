'use client'

import { Trophy, Info, ChevronLeft, Zap, ArrowRight } from 'lucide-react'
import { formatAddress } from '@/lib/nimiq'

interface ResultsProps {
  detail: any
  leaderboard: any[]
  pot: number
  userId: string | null
  busy: boolean
  error: string | null
  onPayout: (payout: any) => void
  onPayAll: () => void
  payAllProgress: { current: number; total: number } | null
  onHistory: () => void
  onBack: () => void
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
  const pendingPayouts = (detail?.payouts ?? []).filter((p: any) => p.status === 'PENDING')
  const confirmedPayouts = (detail?.payouts ?? []).filter((p: any) => p.status !== 'PENDING')
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
        className="mb-4 flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: '#8B8FAD' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0F2FF'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8B8FAD'}
      >
        <ChevronLeft className="size-4" />
        Back to discover
      </button>

      {/* Header */}
      <div className="text-center">
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-2xl gold-glow"
          style={{ background: 'linear-gradient(135deg, #E9B213, #EC991C)', color: '#0D0F1F' }}
        >
          <Trophy className="size-8" />
        </div>
        <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>
          Round complete
        </p>
        <h1 className="mt-1.5 text-3xl font-bold sm:text-4xl">Final results</h1>
        <p className="mt-2 text-sm font-semibold" style={{ color: '#8B8FAD' }}>
          Total Pot: <span className="font-mono text-lg font-bold" style={{ color: '#E9B213' }}>{pot} NIM</span>
        </p>
        {isZeroScore && (
          <p className="mt-1.5 text-xs font-semibold" style={{ color: '#EC991C' }}>
            No correct answers — stakes returned to all players
          </p>
        )}
        {detail?.status === 'SCORING' && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs" style={{ background: 'rgba(233,178,19,0.1)', color: '#E9B213', border: '1px solid rgba(233,178,19,0.2)' }}>
            <div className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Finalizing payouts & winner calculations...</span>
          </div>
        )}
      </div>

      {/* Leaderboard Card */}
      <div className="mt-6 rounded-2xl p-4 sm:p-5 text-left card-3d" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#8B8FAD' }}>
          Standings
        </h3>
        <div className="flex flex-col gap-2">
          {leaderboard.map((l: any, i: number) => {
            const isWinner = i === 0 && l.correctCount > 0
            return (
              <div
                key={l.playerId}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: isWinner ? 'rgba(233,178,19,0.12)' : '#252847',
                  border: isWinner ? '1px solid rgba(233,178,19,0.3)' : '1px solid #2F3355',
                }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  style={{
                    background: isWinner ? '#E9B213' : '#2F3355',
                    color: isWinner ? '#0D0F1F' : '#8B8FAD',
                  }}
                >
                  {i === 0 ? '🏆' : i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium">
                  {l.player?.displayName ?? formatAddress(l.player?.nimiqAddress ?? l.playerId)}
                  {l.playerId === userId && (
                    <span className="ml-1.5 text-xs" style={{ color: '#8B8FAD' }}>(you)</span>
                  )}
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: '#E9B213' }}>
                  {l.correctCount} ✓
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-center gap-2.5 rounded-xl p-3.5 text-xs" style={{ background: 'rgba(33,188,165,0.06)', border: '1px solid rgba(33,188,165,0.2)' }}>
        <Info className="size-4 shrink-0" style={{ color: '#21BCA5' }} />
        <span style={{ color: '#8B8FAD' }}>Host sends payouts via Nimiq Pay. Each transaction is verified on-chain.</span>
      </div>

      {/* Payout section — host only */}
      {showPayouts && (
        <div className="mt-4 rounded-2xl p-4 text-left card-3d" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">
              {isZeroScore ? 'Refunds' : 'Payouts'}{' '}
              <span className="font-normal text-xs" style={{ color: '#8B8FAD' }}>
                ({confirmedPayouts.length}/{detail.payouts.length} paid)
              </span>
            </h3>

            {/* Pay All button — only when 2+ are pending */}
            {pendingPayouts.length >= 2 && (
              <button
                disabled={busy}
                onClick={onPayAll}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all btn-gold"
              >
                <Zap className="size-3.5" />
                {payAllProgress
                  ? `Paying ${payAllProgress.current}/${payAllProgress.total}…`
                  : `Pay All (${pendingPayouts.length})`}
              </button>
            )}
          </div>

          {/* Progress bar during Pay All */}
          {payAllProgress && (
            <div className="mb-3 h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#252847' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(payAllProgress.current / payAllProgress.total) * 100}%`,
                  background: 'linear-gradient(90deg,#E9B213,#EC991C)',
                }}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            {detail.payouts.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: '#252847', border: '1px solid #2F3355' }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {p.recipient?.displayName ?? formatAddress(p.recipient?.nimiqAddress)}
                  </span>
                  <span className="text-xs font-mono font-semibold" style={{ color: '#E9B213' }}>
                    {Number(p.amount)} NIM
                  </span>
                </div>
                {p.status !== 'PENDING' ? (
                  <span className="text-xs font-bold" style={{ color: '#21BCA5' }}>
                    {p.status === 'CONFIRMED' ? 'Paid ✓' : 'Sent ✓'}
                  </span>
                ) : (
                  <button
                    disabled={busy}
                    onClick={() => onPayout(p)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all btn-gold"
                  >
                    {busy && !payAllProgress ? 'Paying…' : 'Pay'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </p>
      )}

      <button
        onClick={onHistory}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all"
        style={{ background: '#252847', border: '1px solid #2F3355', color: '#F0F2FF' }}
      >
        View round history <ArrowRight className="size-4" />
      </button>
    </div>
  )
}
