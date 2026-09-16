'use client'

import { ArrowLeft, Check, ChevronRight, Clock3, ShieldCheck, Zap } from 'lucide-react'
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
  if (!detail || detail.id !== selectedId) return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6 text-center text-sm" style={{ color: '#8B8FAD' }}>
      Loading round details…
    </div>
  )

  // Host should never see the "Pay & join" screen — redirect to lobby.
  const isHost = detail.isHost || detail.hostId === userId
  if (isHost) {
    Promise.resolve().then(() => onGoToLobby())
    return <p className="p-4 text-sm" style={{ color: '#8B8FAD' }}>Opening your round dashboard…</p>
  }

  const confirmed = detail.entries.filter((e) => e.stakeStatus === 'CONFIRMED').length

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-2 text-sm transition-colors"
        style={{ color: '#8B8FAD' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0F2FF'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8B8FAD'}
      >
        <ArrowLeft className="size-4" /> Back to discover
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: '#252847', color: '#8B8FAD' }}>{detail.category}</span>
        <span className="rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(33,188,165,0.12)', color: '#21BCA5' }}>{detail.status}</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{detail.title}</h1>
      <p className="mt-1 text-sm" style={{ color: '#8B8FAD' }}>
        Hosted by <span style={{ color: '#F0F2FF' }}>{detail.host.displayName ?? formatAddress(detail.host.nimiqAddress)}</span>
      </p>

      {/* Stats cards */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl p-4 card-3d" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
          <p className="text-[11px] font-semibold" style={{ color: '#8B8FAD' }}>Stake</p>
          <p className="mt-1 font-mono text-lg font-bold sm:text-xl" style={{ color: '#E9B213' }}>{Number(detail.stakeAmount)} NIM</p>
        </div>
        <div className="rounded-2xl p-4 card-3d" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
          <p className="text-[11px] font-semibold" style={{ color: '#8B8FAD' }}>Questions</p>
          <p className="mt-1 font-mono text-lg font-bold sm:text-xl" style={{ color: '#F0F2FF' }}>{detail.questionCount}</p>
        </div>
        <div className="rounded-2xl p-4 card-3d" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
          <p className="text-[11px] font-semibold" style={{ color: '#8B8FAD' }}>Players</p>
          <p className="mt-1 font-mono text-lg font-bold sm:text-xl" style={{ color: '#21BCA5' }}>{confirmed}/{detail.maxPlayers}</p>
        </div>
      </div>

      {/* Trust banner */}
      <div className="mt-4 flex items-start gap-3 rounded-2xl p-4 text-xs" style={{ background: 'rgba(33,188,165,0.06)', border: '1px solid rgba(33,188,165,0.2)' }}>
        <ShieldCheck className="mt-0.5 size-4 shrink-0" style={{ color: '#21BCA5' }} />
        <p style={{ color: '#8B8FAD' }}>
          Stakes are transferred securely on-chain. Winners are paid immediately upon round completion.
        </p>
      </div>

      {error && <p className="mt-3 rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</p>}

      {(() => {
        const myEntry = userId ? detail.entries.find((e) => e.playerId === userId) : null

        if (myEntry?.stakeStatus === 'CONFIRMED') {
          return (
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'rgba(33,188,165,0.1)', border: '1px solid rgba(33,188,165,0.3)' }}>
                <Check className="size-5 shrink-0" style={{ color: '#21BCA5' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#21BCA5' }}>You're in the round!</p>
                  <p className="text-xs" style={{ color: '#8B8FAD' }}>Your stake of {Number(detail.stakeAmount)} NIM is confirmed.</p>
                </div>
              </div>
              <button onClick={onGoToLobby} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold btn-gold gold-glow">
                Go to lobby <ChevronRight className="size-4" />
              </button>
            </div>
          )
        }

        if (myEntry?.stakeStatus === 'PENDING') {
          return (
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-2xl p-4" style={{ background: 'rgba(233,178,19,0.1)', border: '1px solid rgba(233,178,19,0.3)' }}>
                <Clock3 className="size-5 shrink-0" style={{ color: '#E9B213' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#E9B213' }}>Payment processing</p>
                  <p className="text-xs" style={{ color: '#8B8FAD' }}>Verifying on Nimiq network. Takes a few seconds.</p>
                </div>
              </div>
              <button onClick={onGoToLobby} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold" style={{ background: '#252847', border: '1px solid #2F3355', color: '#F0F2FF' }}>
                Go to lobby <ChevronRight className="size-4" />
              </button>
            </div>
          )
        }

        return (
          <>
            <button
              disabled={busy || (detail.status !== 'OPEN' && detail.status !== 'IN_PROGRESS') || sdkState !== 'connected'}
              onClick={onJoin}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all btn-gold gold-glow disabled:opacity-50"
            >
              <Zap className="size-4" />
              {busy ? 'Processing payment…' : `Pay ${Number(detail.stakeAmount)} NIM & join`}
            </button>
            {sdkState !== 'connected' && (
              <p className="mt-3 text-center text-xs" style={{ color: '#8B8FAD' }}>
                Open inside <span style={{ color: '#E9B213' }}>Nimiq Pay</span> to join and stake NIM.
              </p>
            )}
          </>
        )
      })()}
    </div>
  )
}
