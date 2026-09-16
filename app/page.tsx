'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { History, Home, Plus, WalletMinimal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatAddress, getAccounts, getNimiq, sendPayoutPayment, sendStakePayment } from '@/lib/nimiq'

import Header from '@/app/components/Header'
import Sidebar from '@/app/components/Sidebar'
import Discover from '@/app/components/Discover'
import Create from '@/app/components/Create'
import Detail from '@/app/components/Detail'
import Lobby from '@/app/components/Lobby'
import PlayView from '@/app/components/PlayView'
import Results from '@/app/components/Results'
import HistoryView from '@/app/components/HistoryView'
import Wallet from '@/app/components/Wallet'
import NotificationsPanel from '@/app/components/NotificationsPanel'

type SdkState = 'connecting' | 'connected' | 'browser'
type View = 'discover' | 'create' | 'detail' | 'lobby' | 'play' | 'results' | 'history' | 'wallet'

type RoundListItem = {
  id: string; title: string; category: string; stakeAmount: number | string;
  questionCount: number; maxPlayers: number; status: string;
  confirmedEntries?: number; host?: { nimiqAddress: string; displayName?: string | null };
  createdAt?: string;
}

type RoundDetail = {
  id: string; title: string; category: string; status: string;
  stakeAmount: number | string; questionCount: number; timePerQuestionSeconds: number;
  maxPlayers: number; minPlayers: number; payoutRule: string; categoryMode: string;
  hostId: string; host: { id: string; nimiqAddress: string; displayName?: string | null };
  entries: Array<{ id: string; playerId: string; stakeStatus: string; player: { id: string; nimiqAddress: string; displayName?: string | null } }>;
  isHost?: boolean; confirmedEntries?: number;
}

type CurrentQuestion = {
  id: string; prompt: string; options: string[] | any; orderIndex: number; totalQuestions: number;
}

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: 'discover', label: 'Discover', icon: Home },
  { id: 'create', label: 'Create round', icon: Plus },
  { id: 'history', label: 'My rounds', icon: History },
  { id: 'wallet', label: 'Wallet', icon: WalletMinimal },
]

export default function PageWrapper() {
  return (
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  )
}

function Page() {
  const [sdkState, setSdkState] = useState<SdkState>('connecting')
  const [view, setView] = useState<View>('discover')
  const [previousView, setPreviousView] = useState<View | null>(null)
  const searchParams = useSearchParams()
  const [address, setAddress] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [rounds, setRounds] = useState<RoundListItem[]>([])
  const [loadingRounds, setLoadingRounds] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<RoundDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  // notifications
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  // play
  const [currentQ, setCurrentQ] = useState<CurrentQuestion | null>(null)
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null)
  const [correctOptionIndex, setCorrectOptionIndex] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(20)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [pot, setPot] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // 1. SDK init + auth
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        await getNimiq()
        const accounts: any = await getAccounts()
        if (!active) return
        if (Array.isArray(accounts) && accounts.length > 0) {
          const addr = accounts[0] as string
          setAddress(addr)
          const sess: any = await api.auth.session(addr)
          if (!active) return
          setSessionToken(sess.sessionToken)
          setUserId(sess.user?.id ?? null)
          setSdkState('connected')
        } else {
          setSdkState('browser')
        }
      } catch {
        if (active) setSdkState('browser')
      }
    })()
    return () => { active = false }
  }, [])

  // Read ?join=ROUND_ID from the URL (set by /join/[id] redirect) and
  // auto-open the detail view so the invited player lands on the Pay screen.
  useEffect(() => {
    const joinId = searchParams?.get('join')
    if (joinId) {
      setSelectedId(joinId)
      setView('detail')
    }
  }, [searchParams])

  const loadRounds = useCallback(async () => {
    setLoadingRounds(true)
    setError(null)
    try {
      const data: any = await api.rounds.list()
      setRounds(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoadingRounds(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'discover' || view === 'history') loadRounds()
  }, [view, loadRounds])

  const loadNotifications = useCallback(async () => {
    if (!sessionToken) return
    try {
      const data: any = await api.notifications.list(sessionToken)
      setNotifications(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load notifications', e)
    }
  }, [sessionToken])

  useEffect(() => {
    let active = true
    const poll = async () => {
      if (!active) return
      await loadNotifications().catch(() => {})
      if (active) setTimeout(poll, 10000)
    }
    
    if (sessionToken) {
      poll()
    }
    return () => { active = false }
  }, [sessionToken, loadNotifications])

  const handleMarkAllRead = async () => {
    if (!sessionToken) return
    try {
      await api.notifications.markAllRead(sessionToken)
      await loadNotifications()
    } catch (e) {
      console.error('Failed to mark read', e)
    }
  }

  const loadDetail = useCallback(async (id: string) => {
    try {
      const d: any = await api.rounds.get(id, sessionToken ?? undefined)
      setDetail(d)
      return d
    } catch (e: any) {
      setError(e.message)
      return null
    }
  }, [sessionToken])

  useEffect(() => {
    if ((view === 'detail' || view === 'lobby') && selectedId) loadDetail(selectedId)
  }, [view, selectedId, loadDetail])

  // lobby polling
  useEffect(() => {
    if (view !== 'lobby' || !selectedId) return
    let active = true
    const poll = async () => {
      if (!active) return
      await loadDetail(selectedId).catch(() => {})
      if (active) setTimeout(poll, 3000)
    }
    const t = setTimeout(poll, 3000)
    return () => { active = false; clearTimeout(t) }
  }, [view, selectedId, loadDetail])

  // auto-advance lobby -> play when IN_PROGRESS (players only, not the host)
  const detailStatus = detail?.status ?? null
  const detailIsHost = detail?.isHost ?? false
  const detailHostId = detail?.hostId ?? null
  useEffect(() => {
    if (view === 'lobby' && detailStatus === 'IN_PROGRESS') {
      const isHost = detailIsHost || detailHostId === userId
      if (!isHost) {
        setView('play')
      }
    }
  }, [view, detailStatus, detailIsHost, detailHostId, userId])

  // auto-advance host (or AFK players) to results when the round finishes
  useEffect(() => {
    if (view === 'lobby' && (detailStatus === 'SCORING' || detailStatus === 'AWAITING_PAYOUT' || detailStatus === 'COMPLETED')) {
      setView('results')
    }
  }, [view, detailStatus])

  const loadQuestion = useCallback(async () => {
    if (!selectedId || !sessionToken) return
    try {
      const res: any = await api.rounds.currentQuestion(selectedId, sessionToken)
      if (res.finished) {
        try { await api.rounds.finish(selectedId, sessionToken) } catch {}
        setView('results')
        return
      }
      setCurrentQ(res.question)
      setSelectedOpt(null)
      setCorrectOptionIndex(null)
      setTimeLeft(res.timeRemaining ?? 20)
    } catch (e: any) {
      setError(e.message)
    }
  }, [selectedId, sessionToken])

  useEffect(() => {
    if (view === 'play' && selectedId && sessionToken) loadQuestion()
  }, [view, selectedId, loadQuestion])

  // timer
  const answeredRef = useRef(false)
  useEffect(() => {
    answeredRef.current = selectedOpt !== null
  }, [selectedOpt])

  useEffect(() => {
    if (view !== 'play' || !currentQ) return
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (!answeredRef.current) handleAnswer(true)
          loadQuestion()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [view, currentQ?.id, loadQuestion])

  const loadLeaderboard = useCallback(async () => {
    if (!selectedId) return
    try {
      const res: any = await api.rounds.leaderboard(selectedId)
      setLeaderboard(res.leaderboard ?? [])
      setPot(res.pot ?? 0)
    } catch {}
  }, [selectedId])

  useEffect(() => {
    let active = true
    if ((view === 'play' || view === 'results' || view === 'lobby') && selectedId) {
      const poll = async () => {
        if (!active) return
        await loadLeaderboard().catch(() => {})
        if (active) setTimeout(poll, 3000)
      }
      poll()
    }
    return () => { active = false }
  }, [view, selectedId, loadLeaderboard])

  const handleAnswer = async (expired = false, forcedOpt?: number) => {
    if (!selectedId || !sessionToken || !currentQ || busy) return
    const opt = expired ? -1 : (forcedOpt !== undefined ? forcedOpt : selectedOpt)
    if (opt === null || opt === undefined) return
    setBusy(true)
    try {
      const res: any = await api.rounds.submitAnswer(selectedId, currentQ.id, opt, sessionToken)
      if (res.correctOptionIndex !== undefined) {
        setCorrectOptionIndex(res.correctOptionIndex)
      }
    } catch (e: any) {
      // Ignore "Already answered" if it was sent automatically
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async () => {
    if (!selectedId || !sessionToken || !detail) return
    setBusy(true); setError(null)
    
    let paymentSent = false
    let hash = ''

    try {
      const intent: any = await api.rounds.joinIntent(selectedId, sessionToken)
      const txHash: any = await sendStakePayment(intent.recipientAddress, Number(detail.stakeAmount), selectedId)
      hash = typeof txHash === 'string' ? txHash : (txHash?.hash ?? String(txHash))
      paymentSent = true

      // Retry logic for mobile browsers returning from background
      let confirmed = false
      for (let i = 0; i < 3; i++) {
        try {
          await api.rounds.joinConfirm(selectedId, hash, sessionToken)
          confirmed = true
          break
        } catch (err) {
          console.warn('joinConfirm attempt failed:', err)
          await new Promise(r => setTimeout(r, 2000))
        }
      }
      
      if (!confirmed) {
        console.error('All joinConfirm attempts failed, relying on background cron.')
      }

      await loadDetail(selectedId)
      setView('lobby')
    } catch (e: any) {
      if (!paymentSent) {
        setError(e.message ?? 'Join failed')
      } else {
        // Payment was sent but something crashed. Still move to lobby to poll.
        console.error('Error after payment sent:', e)
        await loadDetail(selectedId).catch(() => {})
        setView('lobby')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleStart = async () => {
    if (!selectedId || !sessionToken) return
    setBusy(true); setError(null)
    try {
      await api.rounds.start(selectedId, sessionToken)
      // Host stays on lobby — it shows the live leaderboard during IN_PROGRESS
    } catch (e: any) {
      setError(e.message ?? 'Start failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteRound = async () => {
    if (!selectedId || !sessionToken) return
    if (!confirm('Are you sure you want to cancel this round?')) return
    setBusy(true); setError(null)
    try {
      await api.rounds.delete(selectedId, sessionToken)
      setView('discover')
      setSelectedId(null)
      loadRounds()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = async (data: any) => {
    if (!sessionToken) { setError('Connect inside Nimiq Pay first'); return }
    setBusy(true); setError(null)
    try {
      const created: any = await api.rounds.create(data, sessionToken)
      setSelectedId(created.id)
      setDetail(null)
      setView('lobby')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const handlePayout = async (payout: any) => {
    if (!selectedId || !sessionToken || !detail || !detail.isHost) return
    setBusy(true); setError(null)
    try {
      // 1. Send payment via Nimiq Mini App SDK
      const txHash: any = await sendPayoutPayment(payout.recipient.nimiqAddress, Number(payout.amount), selectedId, payout.id)
      const hash = typeof txHash === 'string' ? txHash : (txHash?.hash ?? String(txHash))
      
      // 2. Confirm payment with backend
      await api.rounds.payoutConfirm(selectedId, [{ payoutId: payout.id, txHash: hash }], sessionToken)
      
      // 3. Reload detail to update UI
      await loadDetail(selectedId)
    } catch (e: any) {
      setError(e.message ?? 'Payout failed')
    } finally {
      setBusy(false)
    }
  }

  const copyInvite = async () => {
    if (!selectedId) return
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const roundTitle = detail?.title ? encodeURIComponent(detail.title) : ''
    const url = `${origin}/join/${selectedId}${roundTitle ? `?name=${roundTitle}` : ''}`
    await navigator.clipboard?.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const toggleWallet = () => {
    if (view === 'wallet') {
      setView(previousView || 'discover')
    } else {
      setPreviousView(view)
      setView('wallet')
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 sm:px-6 py-4 sm:py-6">
        <Header 
          address={address} 
          sdkState={sdkState} 
          onWalletClick={toggleWallet} 
          unreadNotifications={notifications.filter(n => !n.isRead).length}
          onBellClick={() => setShowNotifications(true)}
        />
        <div className="flex flex-1 gap-4 sm:gap-8 py-6 sm:py-10">
          <Sidebar view={view} setView={setView} />
          <section className="min-w-0 flex-1">
            {view === 'discover' && (
              <Discover
                rounds={rounds}
                loadingRounds={loadingRounds}
                sdkState={sdkState}
                address={address}
                error={error}
                onCreateClick={() => setView('create')}
                onRoundClick={(r, isHost) => { setSelectedId(r.id); setDetail(null); setView(isHost ? 'lobby' : 'detail') }}
              />
            )}
            {view === 'create' && (
              <Create
                onBack={() => setView('discover')}
                onCreate={handleCreate}
                busy={busy}
                error={error}
                sdkState={sdkState}
              />
            )}
            {view === 'detail' && (
              <Detail
                detail={detail}
                selectedId={selectedId}
                userId={userId}
                sessionToken={sessionToken}
                sdkState={sdkState}
                busy={busy}
                error={error}
                onBack={() => setView('discover')}
                onJoin={handleJoin}
                onGoToLobby={() => setView('lobby')}
              />
            )}
            {view === 'lobby' && (
              <Lobby
                detail={detail}
                selectedId={selectedId}
                userId={userId}
                busy={busy}
                error={error}
                leaderboard={leaderboard}
                pot={pot}
                onStart={handleStart}
                onCopyInvite={copyInvite}
                onBack={() => setView('discover')}
                onViewResults={() => setView('results')}
                onDeleteRound={handleDeleteRound}
              />
            )}
            {view === 'play' && (
              <PlayView
                currentQ={currentQ}
                selectedOpt={selectedOpt}
                setSelectedOpt={setSelectedOpt}
                correctOptionIndex={correctOptionIndex}
                timeLeft={timeLeft}
                detail={detail}
                leaderboard={leaderboard}
                busy={busy}
                onAnswer={handleAnswer}
              />
            )}
            {view === 'results' && (
              <Results
                detail={detail}
                leaderboard={leaderboard}
                pot={pot}
                userId={userId}
                busy={busy}
                error={error}
                onPayout={handlePayout}
                onHistory={() => setView('history')}
              />
            )}
            {view === 'history' && (
              <HistoryView rounds={rounds} address={address} />
            )}
            {view === 'wallet' && (
              <Wallet
                address={address}
                userId={userId}
                sdkState={sdkState}
                error={error}
              />
            )}
          </section>
        </div>
        <footer className="border-t py-4 text-xs text-muted-foreground text-center sm:text-left">
          Built for fast minds, powered by Nimiq.
        </footer>
      </div>
      {showNotifications && (
        <NotificationsPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
    </main>
  )
}
