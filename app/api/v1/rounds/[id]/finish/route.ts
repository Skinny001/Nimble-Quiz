import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
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

    const entriesWithAnswers = await Promise.all(
      round.entries.map(async (entry) => {
        const answers = await prisma.answer.findMany({
          where: { roundId: id, playerId: entry.playerId },
        })
        return { ...entry, answers }
      })
    )

    const isHost = round.hostId === user.id
    const allAnswered = entriesWithAnswers.every(e => e.answers.length >= round.questionCount)

    if (!isHost && !allAnswered) {
      return NextResponse.json({ error: 'Not all players have finished' }, { status: 400 })
    }

    if (round.status === 'COMPLETED' || round.status === 'AWAITING_PAYOUT') {
      return NextResponse.json({ error: 'Round already finished' }, { status: 400 })
    }

    const leaderboard = computeLeaderboard(entriesWithAnswers)
    const winners = determineWinners(leaderboard, round.payoutRule)
    const pot = Number(round.stakeAmount) * entriesWithAnswers.length
    const payouts = computePayouts(winners, pot, round.payoutRule)

    await prisma.$transaction(async (tx) => {
      await tx.triviaRound.update({
        where: { id },
        data: { status: 'AWAITING_PAYOUT' },
      })

      await tx.payout.createMany({
        data: payouts.map(p => ({
          roundId: id,
          recipientId: p.recipientId,
          amount: p.amount,
          status: 'PENDING',
        })),
      })
    })

    return NextResponse.json({
      success: true,
      leaderboard,
      winners: winners.map(w => ({
        ...w,
        payout: payouts.find(p => p.recipientId === w.playerId)?.amount || 0,
      })),
      payouts: payouts.map(p => ({
        recipientId: p.recipientId,
        amount: p.amount,
      })),
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Finish round error:', error)
    return NextResponse.json({ error: 'Failed to finish round' }, { status: 500 })
  }
}

function computeLeaderboard(entries: any[]) {
  return entries.map(entry => {
    const correctCount = entry.answers.filter((a: any) => a.isCorrect).length
    const totalTime = entry.answers.reduce((sum: number, a: any) => sum + a.responseTimeMs, 0)
    return {
      playerId: entry.playerId,
      player: entry.player,
      correctCount,
      totalTime,
    }
  }).sort((a, b) => {
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount
    return a.totalTime - b.totalTime
  })
}

function determineWinners(leaderboard: any[], payoutRule: string) {
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const topScore = leaderboard[0]?.correctCount || 0
    return leaderboard.filter(p => p.correctCount === topScore)
  }
  return leaderboard.slice(0, 3)
}

function computePayouts(winners: any[], pot: number, payoutRule: string) {
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const share = pot / winners.length
    return winners.map(w => ({ recipientId: w.playerId, amount: share }))
  }

  const weights = [0.5, 0.3, 0.2]
  const totalWeight = winners.reduce((sum, _, i) => sum + (weights[i] || 0), 0)

  return winners.map((w, i) => ({
    recipientId: w.playerId,
    amount: Math.round((pot * (weights[i] || 0) / totalWeight) * 100) / 100,
  }))
}