'use client'

import { ArrowLeft, Check, ChevronRight, Clock3, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'

type RoundDetail = {
  id: string; title: string; category: string; status: string;
  stakeAmount: number | string; questionCount: number; timePerQuestionSeconds: number;
  maxPlayers: number; minPlayers: number; payoutRule: string; categoryMode: string;
  hostId: string; host: { id: string; nimiqAddress: string; displayName?: string | null };
  entries: Array<{ id: string; playerId: string; stakeStatus: string; player: { id: string; nimiqAddress: string; displayName?: string | null } }>;
  isHost?: boolean; confirmedEntries?: number;
}

interface DetailProps {
  detail: RoundDetail | null;
  selectedId: string | null;
  userId: string | null;
  sessionToken: string | null;
  sdkState: 'connecting' | 'connected' | 'browser';
  busy: boolean;
  error: string | null;
  onBack: () => void;
  onJoin: () => void;
  onGoToLobby: () => void;
}

export default function Detail({
  detail, selectedId, userId, sessionToken, sdkState,
  busy, error, onBack, onJoin, onGoToLobby,
}: DetailProps) {
  if (!detail) return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6 text-center text-muted-foreground">
      Loading round…
    </div>
  )

  // Host should never see the "Pay & join" screen — redirect to lobby.
  const isHost = detail.isHost || detail.hostId === userId
  if (isHost) {
    Promise.resolve().then(() => onGoToLobby())
    return <p className="p-4 text-sm text-muted-foreground">Opening your round dashboard…</p>
  }

  const confirmed = detail.entries.filter((e) => e.stakeStatus === 'CONFIRMED').length

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </button>

      <span className="inline-flex items-center rounded bg-muted px-2 py-1 font-mono text-[10px]">{detail.category} · {detail.status}</span>
      <h1 className="mt-3 text-3xl sm:text-4xl font-semibold">{detail.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Hosted by {detail.host.displayName ?? formatAddress(detail.host.nimiqAddress)}</p>

      <div className="mt-4 grid gap-3 grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Stake</p>
          <p className="mt-1 font-mono text-xl font-bold">{Number(detail.stakeAmount)} NIM</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Questions</p>
          <p className="mt-1 font-mono text-xl font-bold">{detail.questionCount}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Players</p>
          <p className="mt-1 font-mono text-xl font-bold">{confirmed}/{detail.maxPlayers}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-card p-4">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 size-5 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground">
            Stake goes directly to the host wallet. Host pays winners. All txs verifiable on-chain.
          </p>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      {(() => {
        // Check if this user already has an entry in the round
        const myEntry = userId ? detail.entries.find((e) => e.playerId === userId) : null

        if (myEntry?.stakeStatus === 'CONFIRMED') {
          // Already paid and confirmed — show "go to lobby"
          return (
            <div className="mt-6">
              <div className="flex items-center gap-3 rounded-xl bg-primary/10 border border-primary/20 p-4">
                <Check className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold">You're in!</p>
                  <p className="text-xs text-muted-foreground">Your stake of {Number(detail.stakeAmount)} NIM is confirmed.</p>
                </div>
              </div>
              <Button onClick={onGoToLobby} className="mt-3 h-12 w-full">
                Go to lobby <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          )
        }

        if (myEntry?.stakeStatus === 'PENDING') {
          // Payment sent but not confirmed yet
          return (
            <div className="mt-6">
              <div className="flex items-center gap-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
                <Clock3 className="size-5 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold">Payment processing</p>
                  <p className="text-xs text-muted-foreground">Your payment is being verified. This usually takes a few seconds.</p>
                </div>
              </div>
              <Button onClick={onGoToLobby} variant="outline" className="mt-3 h-12 w-full">
                Go to lobby <ChevronRight className="ml-1 size-4" />
              </Button>
            </div>
          )
        }

        // Not joined yet — show pay button
        return (
          <>
            <Button
              disabled={busy || detail.status !== 'OPEN' || sdkState !== 'connected'}
              onClick={onJoin}
              className="mt-6 h-12 w-full"
            >
              {busy ? 'Joining…' : `Pay ${Number(detail.stakeAmount)} NIM & join`}
            </Button>
            {sdkState !== 'connected' && (
              <p className="mt-3 text-xs text-muted-foreground text-center">
                Connect your wallet inside Nimiq Pay to join this round.
              </p>
            )}
          </>
        )
      })()}
    </div>
  )
}
