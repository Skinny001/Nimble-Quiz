import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    if (round.status === 'IN_PROGRESS' && round.startedAt) {
      const elapsedMs = Date.now() - round.startedAt.getTime()
      const totalDurationMs = round.questionCount * round.timePerQuestionSeconds * 1000
      if (elapsedMs > totalDurationMs + 2000) {
        round.status = 'SCORING'
        await prisma.triviaRound.update({ where: { id }, data: { status: 'SCORING' } })
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