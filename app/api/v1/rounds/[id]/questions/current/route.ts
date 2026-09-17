import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { computeLeaderboard, determineWinners, computePayouts } from '@/lib/scoring'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: {
        entries: { where: { stakeStatus: 'CONFIRMED' }, include: { player: { select: { id: true, nimiqAddress: true, displayName: true } } } },
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: true,
      },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    const isConfirmed = round.entries.some(e => e.playerId === user.id)
    if (!isConfirmed && round.hostId !== user.id) {
      return NextResponse.json({ error: 'Not a confirmed participant' }, { status: 403 })
    }

    if (round.status !== 'IN_PROGRESS') {
      if (round.status === 'SCORING' || round.status === 'AWAITING_PAYOUT' || round.status === 'COMPLETED') {
        if (round.status === 'SCORING') {
          await finalizeRound(id)
        }
        return NextResponse.json({ finished: true })
      }
      return NextResponse.json({ error: 'Round not in progress' }, { status: 400 })
    }

    let startedAt = (round as any).startedAt
    if (!startedAt) {
      // First player to start triggers clock with 5s buffer for lobby sync
      startedAt = new Date(Date.now() + 5000)
      await prisma.triviaRound.update({ where: { id }, data: { startedAt } as any })
    }

    const elapsedMs = Date.now() - startedAt.getTime()

    if (elapsedMs < 0) {
      return NextResponse.json({
        isStarting: true,
        question: {
          id: 'starting',
          prompt: 'Game starting soon... Get ready!',
          options: [],
          orderIndex: 0,
          totalQuestions: round.questionCount,
        },
        timeRemaining: Math.ceil(Math.abs(elapsedMs) / 1000),
        currentIndex: 0,
      })
    }

    const activeSeconds = round.timePerQuestionSeconds || 20
    const intermissionSeconds = 5
    const slotSeconds = activeSeconds + intermissionSeconds
    const slotMs = slotSeconds * 1000

    const currentIndex = Math.floor(elapsedMs / slotMs)

    if (currentIndex >= round.questions.length) {
      // Auto-finalize round immediately when time for all questions expires
      await finalizeRound(id)
      return NextResponse.json({ finished: true })
    }

    const currentQuestion = round.questions[currentIndex]
    const offsetInSlotMs = elapsedMs % slotMs
    const offsetInSlotSec = Math.floor(offsetInSlotMs / 1000)

    if (offsetInSlotSec < activeSeconds) {
      const timeRemaining = Math.max(1, activeSeconds - offsetInSlotSec)
      return NextResponse.json({
        isIntermission: false,
        timeRemaining,
        currentIndex,
        question: {
          id: currentQuestion.id,
          prompt: currentQuestion.prompt,
          options: currentQuestion.options,
          orderIndex: currentQuestion.orderIndex,
          totalQuestions: round.questionCount,
        },
      })
    } else {
      const intermissionTimeLeft = Math.max(1, slotSeconds - offsetInSlotSec)
      return NextResponse.json({
        isIntermission: true,
        intermissionTimeLeft,
        correctOptionIndex: currentQuestion.correctOptionIndex,
        currentIndex,
        question: {
          id: currentQuestion.id,
          prompt: currentQuestion.prompt,
          options: currentQuestion.options,
          orderIndex: currentQuestion.orderIndex,
          totalQuestions: round.questionCount,
        },
      })
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get current question error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}