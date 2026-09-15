'use client'

import { useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CreateProps {
  onBack: () => void;
  onCreate: (data: {
    title: string;
    category: string;
    categoryMode: 'SINGLE' | 'MIXED';
    questionCount: number;
    stakeAmount: number;
    timePerQuestionSeconds: number;
    maxPlayers: number;
    payoutRule: 'TOP3_SPLIT' | 'WINNER_TAKE_ALL';
  }) => void;
  busy: boolean;
  error: string | null;
  sdkState: 'connecting' | 'connected' | 'browser';
}

export default function Create({
  onBack,
  onCreate,
  busy,
  error,
  sdkState,
}: CreateProps) {
  const [fTitle, setFTitle] = useState('Friday night quiz')
  const [fCategory, setFCategory] = useState('General Knowledge')
  const [fMode, setFMode] = useState<'SINGLE' | 'MIXED'>('SINGLE')
  const [fCount, setFCount] = useState('10')
  const [fStake, setFStake] = useState('4')
  const [fTime, setFTime] = useState('20')
  const [fMax, setFMax] = useState('12')
  const [fPayout, setFPayout] = useState<'TOP3_SPLIT' | 'WINNER_TAKE_ALL'>('TOP3_SPLIT')

  const handleSubmit = () => {
    if (sdkState !== 'connected') {
      alert('Connect inside Nimiq Pay first')
      return
    }
    onCreate({
      title: fTitle,
      category: fMode === 'MIXED' ? 'General Knowledge' : fCategory,
      categoryMode: fMode,
      stakeAmount: Number(fStake) || 1,
      questionCount: Number(fCount) || 10,
      timePerQuestionSeconds: Number(fTime) || 20,
      payoutRule: fPayout,
      maxPlayers: Number(fMax) || 12,
    })
  }

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to rounds
      </button>

      <div className="mb-6">
        <p className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-primary">Host a competition</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Create a new round</h1>
        <p className="mt-2 text-sm text-muted-foreground">Set the rules, invite your friends, and let the fastest minds win.</p>
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm sm:col-span-2">
            Round name
            <input
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3"
              placeholder="Friday night quiz"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Category mode
            <select value={fMode} onChange={(e) => setFMode(e.target.value as 'SINGLE' | 'MIXED')} className="h-11 rounded-lg border border-input bg-background px-3">
              <option value="SINGLE">Single</option>
              <option value="MIXED">Mixed</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            Category
            <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className="h-11 rounded-lg border border-input bg-background px-3">
              <option value="General Knowledge">General Knowledge</option>
              <option value="Science & Nature">Science & Nature</option>
              <option value="Sports">Sports</option>
              <option value="History">History</option>
              <option value="Film">Film</option>
              <option value="Music">Music</option>
              <option value="Geography">Geography</option>
              <option value="Computers">Computers</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm">
            Questions
            <input
              type="number"
              min={1}
              max={15}
              value={fCount}
              onChange={(e) => setFCount(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Entry stake (NIM)
            <input
              type="number"
              min={1}
              value={fStake}
              onChange={(e) => setFStake(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Time per Q (s)
            <input
              type="number"
              min={10}
              max={60}
              value={fTime}
              onChange={(e) => setFTime(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Max players
            <input
              type="number"
              min={2}
              max={50}
              value={fMax}
              onChange={(e) => setFMax(e.target.value)}
              className="h-11 rounded-lg border border-input bg-background px-3"
            />
          </label>

          <label className="grid gap-2 text-sm">
            Payout
            <select value={fPayout} onChange={(e) => setFPayout(e.target.value as 'TOP3_SPLIT' | 'WINNER_TAKE_ALL')} className="h-11 rounded-lg border border-input bg-background px-3">
              <option value="TOP3_SPLIT">Top 3 (50/30/20)</option>
              <option value="WINNER_TAKE_ALL">Winner take all</option>
            </select>
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        {sdkState !== 'connected' && (
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Connect inside Nimiq Pay to create rounds.
          </p>
        )}

        <Button disabled={busy} onClick={handleSubmit} className="mt-6 h-12 w-full">
          {busy ? 'Creating…' : 'Create round'}
        </Button>
      </div>
    </div>
  )
}
