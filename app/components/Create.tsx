'use client'

import { useState } from 'react'
import { ArrowLeft, Plus, Zap } from 'lucide-react'

interface CreateProps {
  onBack: () => void
  onCreate: (data: {
    title: string
    category: string
    categoryMode: 'SINGLE' | 'MIXED'
    questionCount: number
    stakeAmount: number
    timePerQuestionSeconds: number
    maxPlayers: number
    payoutRule: 'TOP3_SPLIT' | 'WINNER_TAKE_ALL'
  }) => void
  busy: boolean
  error: string | null
  sdkState: 'connecting' | 'connected' | 'browser'
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

  const inputStyle = {
    background: '#252847',
    border: '1px solid #2F3355',
    color: '#F0F2FF',
    borderRadius: '12px',
    outline: 'none',
  }

  return (
    <div className="mx-auto w-full max-w-xl p-4 sm:p-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-2 text-sm transition-colors"
        style={{ color: '#8B8FAD' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#F0F2FF'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#8B8FAD'}
      >
        <ArrowLeft className="size-4" /> Back to rounds
      </button>

      {/* Title */}
      <div className="mb-6">
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest" style={{ color: '#E9B213' }}>
          Host a competition
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create a new round</h1>
        <p className="mt-1.5 text-sm" style={{ color: '#8B8FAD' }}>
          Set the rules, invite your squad, and let the fastest minds win the pot.
        </p>
      </div>

      {/* Form Card */}
      <div className="card-3d rounded-2xl p-5 sm:p-7" style={{ background: '#1A1D35', border: '1px solid #2F3355' }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-semibold sm:col-span-2" style={{ color: '#8B8FAD' }}>
            Round name
            <input
              value={fTitle}
              onChange={(e) => setFTitle(e.target.value)}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
              placeholder="Friday night quiz"
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold" style={{ color: '#8B8FAD' }}>
            Category mode
            <select
              value={fMode}
              onChange={(e) => setFMode(e.target.value as 'SINGLE' | 'MIXED')}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
            >
              <option value="SINGLE">Single Category</option>
              <option value="MIXED">Mixed Categories</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-xs font-semibold" style={{ color: '#8B8FAD' }}>
            Category
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value)}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
              disabled={fMode === 'MIXED'}
            >
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

          <label className="grid gap-1.5 text-xs font-semibold" style={{ color: '#8B8FAD' }}>
            Questions count
            <input
              type="number"
              min={1}
              max={15}
              value={fCount}
              onChange={(e) => setFCount(e.target.value)}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold" style={{ color: '#8B8FAD' }}>
            Entry stake (NIM)
            <input
              type="number"
              min={1}
              value={fStake}
              onChange={(e) => setFStake(e.target.value)}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold" style={{ color: '#8B8FAD' }}>
            Time per question (s)
            <input
              type="number"
              min={10}
              max={60}
              value={fTime}
              onChange={(e) => setFTime(e.target.value)}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold" style={{ color: '#8B8FAD' }}>
            Max players
            <input
              type="number"
              min={2}
              max={50}
              value={fMax}
              onChange={(e) => setFMax(e.target.value)}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
            />
          </label>

          <label className="grid gap-1.5 text-xs font-semibold sm:col-span-2" style={{ color: '#8B8FAD' }}>
            Payout distribution
            <select
              value={fPayout}
              onChange={(e) => setFPayout(e.target.value as 'TOP3_SPLIT' | 'WINNER_TAKE_ALL')}
              className="h-11 w-full px-3.5 text-sm font-medium transition-all focus:border-[#E9B213]"
              style={inputStyle}
            >
              <option value="TOP3_SPLIT">Top 3 Split (50% / 30% / 20%)</option>
              <option value="WINNER_TAKE_ALL">Winner Take All (100%)</option>
            </select>
          </label>
        </div>

        {error && (
          <p className="mt-4 rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}

        {sdkState !== 'connected' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl p-3 text-xs" style={{ background: 'rgba(233,178,19,0.08)', color: '#8B8FAD', border: '1px solid rgba(233,178,19,0.2)' }}>
            <Zap className="size-4 shrink-0" style={{ color: '#E9B213' }} />
            Open inside Nimiq Pay to create live rounds with real NIM.
          </div>
        )}

        <button
          disabled={busy}
          onClick={handleSubmit}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all btn-gold gold-glow disabled:opacity-50"
        >
          <Plus className="size-4" />
          {busy ? 'Creating round…' : 'Create round'}
        </button>
      </div>
    </div>
  )
}
