import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { finalizeRound } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: {
        entries: {
          where: { stakeStatus: 'CONFIRMED' },
          include: {
            player: { select: { id: true, nimiqAddress: true, displayName: true } },
          },
        },
      },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status === 'IN_PROGRESS' || round.status === 'SCORING') {
      const startedAt = (round as any).startedAt
      const activeSeconds = round.timePerQuestionSeconds || 20
      const intermissionSeconds = 5
      const totalSlotMs = round.questionCount * (activeSeconds + intermissionSeconds) * 1000
      const elapsedMs = startedAt ? Date.now() - startedAt.getTime() : 0

      if (round.status === 'SCORING' || (startedAt && elapsedMs > totalSlotMs)) {
        const finalized = await finalizeRound(id)
        if (finalized) {
          round.status = finalized.status
        }
      }
    }

    const entriesWithAnswers = await Promise.all(
      round.entries.map(async (entry) => {
        const answers = await prisma.answer.findMany({
          where: { roundId: id, playerId: entry.playerId },
        })
        return { ...entry, answers }
      })
    )

    const leaderboard = entriesWithAnswers.map(entry => {
      const correctCount = entry.answers.filter(a => a.isCorrect).length
      const totalTime = entry.answers.reduce((sum, a) => sum + a.responseTimeMs, 0)
      return {
        playerId: entry.playerId,
        player: entry.player,
        correctCount,
        totalTime,
        answeredCount: entry.answers.length,
      }
    }).sort((a, b) => {
      if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount
      return a.totalTime - b.totalTime
    }).map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    return NextResponse.json({
      leaderboard,
      roundStatus: round.status,
      pot: Number(round.stakeAmount) * entriesWithAnswers.length,
    })
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}