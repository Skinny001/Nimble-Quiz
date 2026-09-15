'use client'

import { useState } from 'react'
import { Clock3, ChevronRight, Check, Zap, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAddress } from '@/lib/nimiq'

type CurrentQuestion = {
  id: string; prompt: string; options: string[] | any; orderIndex: number; totalQuestions: number;
}

interface PlayViewProps {
  currentQ: CurrentQuestion | null;
  selectedOpt: number | null;
  setSelectedOpt: (opt: number | null) => void;
  correctOptionIndex: number | null;
  timeLeft: number;
  detail: any;
  leaderboard: any[];
  busy: boolean;
  onAnswer: (expired: boolean, forcedOpt?: number) => void;
}

export default function PlayView({
  currentQ,
  selectedOpt,
  setSelectedOpt,
  correctOptionIndex,
  timeLeft,
  detail,
  leaderboard,
  busy,
  onAnswer,
}: PlayViewProps) {
  const opts = Array.isArray(currentQ?.options) ? currentQ.options : []

  if (!currentQ) return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6 text-center text-muted-foreground">
      Loading question…
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Question {(currentQ.orderIndex ?? 0) + 1} of {currentQ.totalQuestions}
        </p>
        <div className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 font-mono text-sm font-bold">
          <Clock3 className="size-4 text-primary" />
          {String(timeLeft).padStart(2, '0')}s
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <h1 className="text-lg sm:text-xl font-semibold">{currentQ.prompt}</h1>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {opts.map((a: string, i: number) => {
            let className = "relative flex items-center justify-between rounded-xl border p-4 text-left transition-all "
            
            if (correctOptionIndex !== null) {
              if (i === correctOptionIndex) {
                className += "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400 font-bold"
              } else if (i === selectedOpt) {
                className += "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
              } else {
                className += "opacity-50"
              }
            } else {
              if (selectedOpt === i) {
                className += "border-primary bg-primary/5 ring-1 ring-primary"
              } else {
                className += "hover:bg-secondary/50"
              }
            }

            return (
              <button
                key={i}
                disabled={busy || selectedOpt !== null}
                onClick={() => {
                  if (busy || selectedOpt !== null) return
                  setSelectedOpt(i)
                  onAnswer(false, i)
                }}
                className={className}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-muted-foreground">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-medium">{a}</span>
                </div>
                {correctOptionIndex !== null && i === correctOptionIndex && (
                  <Check className="size-5 text-green-500" />
                )}
              </button>
            )
          })}
        </div>
        
        {busy && (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground animate-pulse">
            <Zap className="size-4 text-primary" />
            Submitting answer...
          </div>
        )}
      </div>

      {leaderboard.length > 0 && (
        <div className="mt-4 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Live standings</h3>
          </div>
          {leaderboard.map((l: any) => (
            <div key={l.playerId} className="flex items-center justify-between border-t py-2 text-sm">
              <span className="flex-1">
                {l.player?.displayName ?? formatAddress(l.player?.nimiqAddress ?? l.playerId)}
                <span className="ml-2 font-mono text-primary">· {l.correctCount} ✓</span>
              </span>
              <span className="font-mono text-muted-foreground">{(l.totalTime / 1000).toFixed(1)}s</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
