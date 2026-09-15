'use client'

import { ArrowLeft, Play, Check, Clock3, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'
import { useState, useEffect } from 'react'

type RoundDetail = {
  id: string; title: string; category: string; status: string;
  stakeAmount: number | string; questionCount: number; timePerQuestionSeconds: number;
  maxPlayers: number; minPlayers: number; payoutRule: string; categoryMode: string;
  hostId: string; host: { id: string; nimiqAddress: string; displayName?: string | null };
  entries: Array<{ id: string; playerId: string; stakeStatus: string; player: { id: string; nimiqAddress: string; displayName?: string | null } }>;
  isHost?: boolean; confirmedEntries?: number;
}

interface LobbyProps {
  detail: RoundDetail | null;
  selectedId: string | null;
  userId: string | null;
  busy: boolean;
  error: string | null;
  leaderboard: any[];
  pot: number;
  onStart: () => void;
  onCopyInvite: () => void;
  onBack: () => void;
  onViewResults: () => void;
  onDeleteRound?: () => void;
}

export default function Lobby({
  detail, selectedId, userId, busy, error,
  leaderboard, pot,
  onStart, onCopyInvite, onBack, onViewResults, onDeleteRound,
}: LobbyProps) {
  const [copied, setCopied] = useState(false)
  
  const isDone = detail?.status === 'AWAITING_PAYOUT' || detail?.status === 'COMPLETED'
  
  // If round finished, go to results safely via side effect
  useEffect(() => {
    if (isDone) {
      onViewResults()
    }
  }, [isDone, onViewResults])

  if (!detail || detail.id !== selectedId) return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6 text-center text-muted-foreground">
      Loading lobby…
    </div>
  )

  const confirmed = detail.entries.filter((e) => e.stakeStatus === 'CONFIRMED')
  const isHost = detail.isHost
  const inProgress = detail.status === 'IN_PROGRESS' || detail.status === 'SCORING'

  if (isDone) {
    return <p className="p-4 text-sm text-muted-foreground">Round complete — loading results…</p>
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />Back
      </button>
      <p className="font-mono text-xs font-bold uppercase tracking-wide text-primary">Round #{detail.id.slice(0, 6)}</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-semibold">{inProgress ? 'Round in progress' : 'Waiting lobby'}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Status: {detail.status} · {confirmed.length}/{detail.maxPlayers} confirmed</p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-xl border bg-card p-4 sm:p-6">
          {inProgress && isHost ? (
            <>
              <h2 className="font-semibold">Live leaderboard</h2>
              <p className="mt-1 text-xs text-muted-foreground">Players are answering questions. Standings update live.</p>
              {leaderboard.length > 0 ? (
                <div className="mt-4 flex flex-col gap-1">
                  {leaderboard.map((l: any, i: number) => (
                    <div key={l.playerId} className="flex items-center gap-3 rounded-lg bg-secondary/60 px-4 py-3">
                      <span className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>{i + 1}</span>
                      <span className="flex-1 text-sm truncate">{l.player?.displayName ?? formatAddress(l.player?.nimiqAddress ?? l.playerId)}</span>
                      <span className="font-mono text-sm">{l.correctCount} ✓ · {(l.totalTime / 1000).toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Waiting for players to answer…</p>
              )}
              {pot > 0 && <p className="mt-4 text-sm text-muted-foreground">Prize pot: <span className="font-mono font-bold text-foreground">{pot} NIM</span></p>}
            </>
          ) : (
            <>
              <h2 className="font-semibold">Players ({confirmed.length} confirmed, {detail.entries.length} total)</h2>
              <div className="mt-4 flex flex-col gap-2">
                {detail.entries.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-4 py-3">
                    <span className="text-sm truncate">{e.player.displayName ?? formatAddress(e.player.nimiqAddress)}{e.playerId === userId ? ' · you' : ''}</span>
                    {e.stakeStatus === 'CONFIRMED' ? (
                      <span className="flex items-center gap-1 text-xs text-primary"><Check className="size-4" /> Paid</span>
                    ) : e.stakeStatus === 'PENDING' ? (
                      <span className="flex items-center gap-1 text-xs text-yellow-500"><Clock3 className="size-3.5" /> Pending</span>
                    ) : (
                      <span className="text-xs text-destructive">Failed</span>
                    )}
                  </div>
                ))}
                {detail.entries.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No players yet. Share the invite link!</p>}
              </div>
              {isHost ? (
                <div className="mt-6 flex flex-col gap-2">
                  <Button disabled={busy || confirmed.length < detail.minPlayers} onClick={onStart} className="h-12 w-full">
                    <Play className="mr-2 size-4" />{busy ? 'Starting…' : `Start round (${confirmed.length}/${detail.minPlayers} min)`}
                  </Button>
                  {detail.status === 'OPEN' && confirmed.length === 0 && onDeleteRound && (
                    <Button variant="outline" onClick={onDeleteRound} disabled={busy} className="h-10 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20">
                      Cancel round
                    </Button>
                  )}
                </div>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground text-center">Waiting for host to start… (auto-refreshes)</p>
              )}
            </>
          )}
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>
        <div className="rounded-xl border bg-secondary/50 p-4 sm:p-5 text-sm">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Invite link</p>
          <p className="mt-1 text-xs text-muted-foreground">Share this link so players can join and pay directly.</p>
          <button
            onClick={() => { onCopyInvite(); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-xs font-medium hover:border-primary"
          >
            <span className="min-w-0 truncate text-left">
              <span className="block font-semibold">{detail.title}</span>
              <span className="font-mono text-muted-foreground">/join/{detail.id.slice(0, 12)}…</span>
            </span>
            {copied ? <span className="shrink-0 text-primary font-semibold">✓ Copied!</span> : <Copy className="size-3.5 shrink-0" />}
          </button>
          <p className="mt-2 text-[10px] text-muted-foreground">Stake: {Number(detail.stakeAmount)} NIM · {detail.questionCount} questions</p>
        </div>
      </div>
    </div>
  )
}
