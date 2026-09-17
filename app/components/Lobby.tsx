'use client'

import { ArrowLeft, Play, Check, Clock3, Copy, Share2, QrCode, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type RoundDetail = {
  id: string
  title: string
  category: string
  status: string
  stakeAmount: number | string
  questionCount: number
  timePerQuestionSeconds: number
  maxPlayers: number
  minPlayers: number
  payoutRule: string
  categoryMode: string
  hostId: string
  host: { id: string; nimiqAddress: string; displayName?: string | null }
  entries: Array<{
    id: string
    playerId: string
    stakeStatus: string
    player: { id: string; nimiqAddress: string; displayName?: string | null }
  }>
  isHost?: boolean
  confirmedEntries?: number
}

interface LobbyProps {
  detail: RoundDetail | null
  selectedId: string | null
  userId: string | null
  busy: boolean
  error: string | null
  leaderboard: any[]
  pot: number
  onStart: () => void
  onCopyInvite: () => void
  onBack: () => void
  onViewResults: () => void
  onDeleteRound?: () => void
}

export default function Lobby({
  detail,
  selectedId,
  userId,
  busy,
  error,
  leaderboard,
  pot,
  onStart,
  onCopyInvite,
  onBack,
  onViewResults,
  onDeleteRound,
}: LobbyProps) {
  const [copied, setCopied] = useState(false)
  // Pop up social share modal automatically when lobby loads for open rounds
  const [showShareModal, setShowShareModal] = useState(true)

  const isDone = detail?.status === 'AWAITING_PAYOUT' || detail?.status === 'COMPLETED'

  useEffect(() => {
    if (isDone) onViewResults()
  }, [isDone, onViewResults])

  if (!detail || detail.id !== selectedId) return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6 text-center text-sm" style={{ color: '#8B8FAD' }}>
      Loading lobby…
    </div>
  )

  if (isDone) return (
    <p className="p-4 text-sm" style={{ color: '#8B8FAD' }}>Round complete — loading results…</p>
  )

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${detail.id}`
    : `https://nimblequiz.vercel.app/join/${detail.id}`

  const shareText = `Join my Nimble Quiz round!\n"${detail.title}" — Stake ${Number(detail.stakeAmount)} NIM to play.\n${joinUrl}`

  const shareLinks = [
    {
      label: 'WhatsApp',
      image: '/vecteezy_logo-icon-3d.png',
      color: '#25D366',
      href: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
    },
    {
      label: 'Telegram',
      image: '/round-telegram-logo.jpg',
      color: '#29B6F6',
      href: `https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${encodeURIComponent(`Join my Nimble Quiz: "${detail.title}" — Stake ${Number(detail.stakeAmount)} NIM!`)}`,
    },
    {
      label: 'X / Twitter',
      image: '/X-3d-logo.png',
      color: '#F0F2FF',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Playing Nimble Quiz on @nimiq — "${detail.title}" — Stake ${Number(detail.stakeAmount)} NIM to join! ${joinUrl}`)}`,
    },
  ]

  const confirmed = detail.entries.filter((e) => e.stakeStatus === 'CONFIRMED')
  const isHost = detail.isHost || detail.hostId === userId
  const inProgress = detail.status === 'IN_PROGRESS' || detail.status === 'SCORING'

  const handleCopy = () => {
    onCopyInvite()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-6">
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
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>
        Round #{detail.id.slice(0, 6)}
      </p>
      <h1 className="mt-1.5 text-2xl font-bold sm:text-3xl">{inProgress ? 'Round in progress' : 'Waiting lobby'}</h1>
      <p className="mt-1 text-sm" style={{ color: '#8B8FAD' }}>
        Status: <span style={{ color: '#F0F2FF' }}>{detail.status}</span> · {confirmed.length}/{detail.maxPlayers} confirmed
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_260px]">
        {/* Main panel */}
        <div className="card-3d rounded-2xl p-4 sm:p-5" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
          {inProgress && isHost ? (
            <>
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: '#F0F2FF' }}>Live leaderboard</h2>
              <p className="mt-1 text-xs" style={{ color: '#8B8FAD' }}>Players are answering. Standings update live.</p>
              {leaderboard.length > 0 ? (
                <div className="mt-4 flex flex-col gap-1.5">
                  {leaderboard.map((l: any, i: number) => (
                    <div
                      key={l.playerId}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 card-3d"
                      style={{
                        background: i === 0 ? 'rgba(233,178,19,0.1)' : '#252847',
                        border: i === 0 ? '1px solid rgba(233,178,19,0.25)' : '1px solid transparent',
                      }}
                    >
                      <span
                        className="flex size-8 items-center justify-center rounded-full text-xs font-bold"
                        style={{ background: i === 0 ? '#E9B213' : '#2F3355', color: i === 0 ? '#0D0F1F' : '#8B8FAD' }}
                      >
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-sm">
                        {l.player?.displayName ?? formatAddress(l.player?.nimiqAddress ?? l.playerId)}
                      </span>
                      <span className="font-mono text-sm font-bold" style={{ color: '#E9B213' }}>
                        {l.correctCount} ✓
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm" style={{ color: '#8B8FAD' }}>Waiting for players to answer…</p>
              )}
              {pot > 0 && (
                <p className="mt-4 text-sm" style={{ color: '#8B8FAD' }}>
                  Prize pot: <span className="font-mono font-bold" style={{ color: '#E9B213' }}>{pot} NIM</span>
                </p>
              )}
            </>
          ) : (
            <>
              <h2 className="font-semibold text-sm sm:text-base" style={{ color: '#F0F2FF' }}>
                Players <span className="font-normal text-xs" style={{ color: '#8B8FAD' }}>({confirmed.length} paid · {detail.entries.length} total)</span>
              </h2>
              <div className="mt-4 flex flex-col gap-2">
                {detail.entries.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{ background: '#252847', border: '1px solid #2F3355' }}
                  >
                    <span className="truncate text-sm">
                      {e.player.displayName ?? formatAddress(e.player.nimiqAddress)}
                      {e.playerId === userId && <span className="ml-1.5 text-xs" style={{ color: '#8B8FAD' }}>(you)</span>}
                    </span>
                    {e.stakeStatus === 'CONFIRMED' ? (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#21BCA5' }}>
                        <Check className="size-3.5" /> Paid
                      </span>
                    ) : e.stakeStatus === 'PENDING' ? (
                      <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: '#E9B213' }}>
                        <Clock3 className="size-3.5" /> Pending
                      </span>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Failed</span>
                    )}
                  </div>
                ))}
                {detail.entries.length === 0 && (
                  <p className="py-6 text-center text-sm" style={{ color: '#8B8FAD' }}>No players yet — share the invite!</p>
                )}
              </div>

              {isHost ? (
                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    disabled={busy || confirmed.length < detail.minPlayers}
                    onClick={onStart}
                    className="h-12 w-full btn-gold"
                    style={{ borderRadius: '14px' }}
                  >
                    <Play className="mr-2 size-4" />
                    {busy ? 'Starting…' : `Start round (${confirmed.length}/${detail.minPlayers} min)`}
                  </Button>
                  {detail.status === 'OPEN' && confirmed.length === 0 && onDeleteRound && (
                    <Button
                      variant="outline"
                      onClick={onDeleteRound}
                      disabled={busy}
                      className="h-10"
                      style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}
                    >
                      Cancel round
                    </Button>
                  )}
                </div>
              ) : (
                <p className="mt-5 text-center text-sm" style={{ color: '#8B8FAD' }}>Waiting for host to start…</p>
              )}
            </>
          )}
          {error && <p className="mt-3 text-sm" style={{ color: '#EF4444' }}>{error}</p>}
        </div>

        {/* Share panel */}
        <div className="flex flex-col gap-3">
          {/* Share sheet */}
          <div className="card-3d rounded-2xl p-4" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
            <div className="flex items-center gap-2 mb-3">
              <Share2 className="size-4" style={{ color: '#E9B213' }} />
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>Share round</p>
            </div>

            {/* Social 3D buttons */}
            <div className="flex gap-2 mb-3">
              {shareLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  className="flex flex-1 items-center justify-center rounded-xl py-2 px-3 transition-all hover:scale-105"
                  style={{ background: '#252847', border: '1px solid #2F3355' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = link.color; (e.currentTarget as HTMLElement).style.background = `${link.color}18` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2F3355'; (e.currentTarget as HTMLElement).style.background = '#252847' }}
                >
                  <img src={link.image} alt={link.label} className="h-6 w-6 object-contain rounded-md shrink-0" />
                </a>
              ))}
            </div>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition-all"
              style={{ background: '#252847', border: '1px solid #2F3355' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E9B213' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#2F3355' }}
            >
              <span className="min-w-0 truncate text-left">
                <span className="block font-semibold" style={{ color: '#F0F2FF' }}>{detail.title}</span>
                <span className="font-mono text-[11px]" style={{ color: '#8B8FAD' }}>/join/{detail.id.slice(0, 10)}…</span>
              </span>
              {copied
                ? <span className="shrink-0 font-semibold" style={{ color: '#21BCA5' }}>✓ Copied!</span>
                : <Copy className="size-3.5 shrink-0" style={{ color: '#8B8FAD' }} />}
            </button>
          </div>

          {/* Open Pop-up Share & QR Modal button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold transition-all btn-gold gold-glow"
          >
            <Sparkles className="size-4" />
            Share & QR Pop-up
          </button>

          {/* Round info */}
          <div className="rounded-2xl p-4 text-xs" style={{ background: '#1A1D35', border: '1px solid #2F3355', color: '#8B8FAD' }}>
            <div className="flex justify-between"><span>Stake</span><span className="font-mono font-bold" style={{ color: '#E9B213' }}>{Number(detail.stakeAmount)} NIM</span></div>
            <div className="mt-1.5 flex justify-between"><span>Questions</span><span style={{ color: '#F0F2FF' }}>{detail.questionCount}</span></div>
            <div className="mt-1.5 flex justify-between"><span>Time/Q</span><span style={{ color: '#F0F2FF' }}>{detail.timePerQuestionSeconds}s</span></div>
            <div className="mt-1.5 flex justify-between"><span>Payout</span><span style={{ color: '#F0F2FF' }}>{detail.payoutRule === 'WINNER_TAKE_ALL' ? 'Winner takes all' : 'Top 3'}</span></div>
          </div>
        </div>
      </div>

      {/* Pop-up Social Share & QR Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(13,15,31,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl p-6 sm:p-7 text-center card-3d gold-glow animate-in zoom-in-95 duration-200"
            style={{ background: '#1A1D35', border: '1px solid rgba(233,178,19,0.35)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full transition-colors"
              style={{ background: '#252847', color: '#8B8FAD' }}
            >
              <X className="size-4" />
            </button>

            {/* Title */}
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(233,178,19,0.15)', color: '#E9B213' }}>
              <Share2 className="size-6" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Share Your Round</h3>
            <p className="mt-1 text-xs" style={{ color: '#8B8FAD' }}>
              Invite players via WhatsApp, Telegram, X, or scan the QR code in Nimiq Pay.
            </p>

            {/* 3D Social Media Share Links */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {shareLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 px-2 transition-all hover:scale-105"
                  style={{ background: '#252847', border: `1px solid ${link.color}40` }}
                >
                  <img src={link.image} alt={link.label} className="h-8 w-8 object-contain rounded-lg shrink-0" />
                  <span className="text-[11px] font-semibold" style={{ color: '#F0F2FF' }}>{link.label.split(' ')[0]}</span>
                </a>
              ))}
            </div>

            {/* QR Code Container */}
            <div className="mx-auto mt-5 w-fit rounded-2xl p-3.5" style={{ background: '#FFFFFF' }}>
              <QRCodeSVG
                value={joinUrl}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="mt-2.5 text-[11px] font-semibold" style={{ color: '#21BCA5' }}>Scan to join inside Nimiq Pay</p>

            {/* Copy Link Button */}
            <button
              onClick={handleCopy}
              className="mt-4 flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-xs font-semibold transition-all"
              style={{ background: '#252847', border: '1px solid #2F3355' }}
            >
              <span className="truncate font-mono" style={{ color: '#8B8FAD' }}>{joinUrl.replace(/^https?:\/\//, '')}</span>
              {copied
                ? <span className="shrink-0 font-bold" style={{ color: '#21BCA5' }}>✓ Copied</span>
                : <Copy className="size-4 shrink-0" style={{ color: '#E9B213' }} />}
            </button>

            {/* Action button */}
            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 flex h-11 w-full items-center justify-center rounded-xl text-xs font-semibold transition-all btn-gold"
            >
              Continue to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
