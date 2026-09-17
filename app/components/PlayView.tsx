'use client'

import { Clock3, Check, Zap, Trophy, X } from 'lucide-react'
import { formatAddress } from '@/lib/nimiq'

type CurrentQuestion = {
  id: string
  prompt: string
  options: string[] | any
  orderIndex: number
  totalQuestions: number
}

interface PlayViewProps {
  currentQ: CurrentQuestion | null
  selectedOpt: number | null
  setSelectedOpt: (opt: number | null) => void
  correctOptionIndex: number | null
  timeLeft: number
  isIntermission?: boolean
  intermissionTimeLeft?: number
  detail: any
  leaderboard: any[]
  busy: boolean
  onAnswer: (expired: boolean, forcedOpt?: number) => void
}

export default function PlayView({
  currentQ,
  selectedOpt,
  setSelectedOpt,
  correctOptionIndex,
  timeLeft,
  isIntermission = false,
  intermissionTimeLeft = 5,
  detail,
  leaderboard,
  busy,
  onAnswer,
}: PlayViewProps) {
  const opts = Array.isArray(currentQ?.options) ? currentQ.options : []

  if (!currentQ) return (
    <div className="mx-auto w-full max-w-xl p-6 text-center text-sm" style={{ color: '#8B8FAD' }}>
      Loading question…
    </div>
  )

  const total = currentQ.totalQuestions || 1
  const timerColor = isIntermission
    ? '#21BCA5'
    : timeLeft > 8
    ? '#E9B213'
    : timeLeft > 4
    ? '#EC991C'
    : '#EF4444'

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      {/* Progress + timer row */}
      <div className="mb-5 flex items-center justify-between gap-3">
        {/* Question progress bar */}
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-[11px]" style={{ color: '#8B8FAD' }}>
            <span>Question {(currentQ.orderIndex ?? 0) + 1} of {total}</span>
            <span>{Math.round((((currentQ.orderIndex ?? 0) + (isIntermission ? 1 : 0)) / total) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: '#2F3355' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((((currentQ.orderIndex ?? 0) + (isIntermission ? 1 : 0)) / total) * 100)}%`,
                background: 'linear-gradient(90deg,#E9B213,#EC991C)',
              }}
            />
          </div>
        </div>

        {/* Timer */}
        <div
          className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-mono text-sm font-bold"
          style={{
            background: '#1A1D35',
            border: `1px solid ${timerColor}40`,
            color: timerColor,
            boxShadow: `0 0 12px ${timerColor}20`,
          }}
        >
          <Clock3 className="size-4" />
          {isIntermission ? `${intermissionTimeLeft}s` : `${String(timeLeft).padStart(2, '0')}s`}
        </div>
      </div>

      {/* Question card */}
      <div
        className="card-3d rounded-2xl p-5 sm:p-7"
        style={{
          background: '#1A1D35',
          border: '1px solid #2F3355',
          transform: 'perspective(800px) rotateX(1deg)',
        }}
      >
        <h1 className="text-base font-semibold leading-snug sm:text-lg">{currentQ.prompt}</h1>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {opts.map((a: string, i: number) => {
            let bg = '#252847'
            let border = '#2F3355'
            let color = '#F0F2FF'

            const showReveal = isIntermission || correctOptionIndex !== null

            if (showReveal) {
              if (i === correctOptionIndex) {
                bg = 'rgba(33,188,165,0.18)'
                border = '#21BCA5'
                color = '#21BCA5'
              } else if (i === selectedOpt) {
                bg = 'rgba(239,68,68,0.18)'
                border = '#EF4444'
                color = '#EF4444'
              } else {
                bg = 'rgba(37,40,71,0.5)'
                border = 'transparent'
                color = '#8B8FAD'
              }
            } else if (selectedOpt === i) {
              bg = 'rgba(233,178,19,0.12)'
              border = '#E9B213'
              color = '#E9B213'
            }

            return (
              <button
                key={i}
                disabled={busy || selectedOpt !== null || isIntermission}
                onClick={() => {
                  if (busy || selectedOpt !== null || isIntermission) return
                  setSelectedOpt(i)
                  onAnswer(false, i)
                }}
                className="relative flex items-center gap-3 rounded-xl p-4 text-left transition-all"
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  color,
                  boxShadow: selectedOpt === i && !showReveal ? '0 0 16px rgba(233,178,19,0.15)' : undefined,
                }}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(47,51,85,0.8)', color: '#8B8FAD' }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1 text-sm font-medium leading-snug">{a}</span>

                {showReveal && i === correctOptionIndex && (
                  <Check className="size-5 shrink-0" style={{ color: '#21BCA5' }} />
                )}
                {showReveal && i === selectedOpt && i !== correctOptionIndex && (
                  <X className="size-5 shrink-0" style={{ color: '#EF4444' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Intermission banner */}
        {isIntermission && (
          <div
            className="mt-5 flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-semibold animate-pulse"
            style={{
              background: 'rgba(233,178,19,0.12)',
              border: '1px solid rgba(233,178,19,0.3)',
              color: '#E9B213',
            }}
          >
            <Clock3 className="size-4 shrink-0" />
            Next question starting in {intermissionTimeLeft}s...
          </div>
        )}

        {busy && !isIntermission && (
          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium animate-pulse" style={{ color: '#E9B213' }}>
            <Zap className="size-4" />
            Submitting answer…
          </div>
        )}
      </div>

      {/* Live standings */}
      {leaderboard.length > 0 && (
        <div className="mt-4 rounded-2xl p-4" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="size-4" style={{ color: '#E9B213' }} />
            <h3 className="text-sm font-semibold">Live standings</h3>
          </div>
          {leaderboard.map((l: any, i: number) => (
            <div key={l.playerId} className="flex items-center justify-between py-2 text-sm"
              style={{ borderTop: i > 0 ? '1px solid #2F3355' : undefined }}>
              <div className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded text-[10px] font-bold"
                  style={{ background: i === 0 ? '#E9B213' : '#252847', color: i === 0 ? '#0D0F1F' : '#8B8FAD' }}>{i + 1}</span>
                <span>{l.player?.displayName ?? formatAddress(l.player?.nimiqAddress ?? l.playerId)}</span>
              </div>
              <span className="font-mono text-xs" style={{ color: '#E9B213' }}>{l.correctCount} ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
