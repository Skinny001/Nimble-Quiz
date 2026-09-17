export function computeLeaderboard(entriesWithAnswers: any[]) {
  return entriesWithAnswers.map(entry => {
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

export function determineWinners(leaderboard: any[], payoutRule: string) {
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const topScore = leaderboard[0]?.correctCount || 0
    return leaderboard.filter(p => p.correctCount === topScore)
  }
  return leaderboard.slice(0, 3)
}

export function computePayouts(winners: any[], pot: number, payoutRule: string) {
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

export async function finalizeRound(roundId: string) {
  const { prisma } = await import('@/lib/prisma')
  const round = await prisma.triviaRound.findUnique({
    where: { id: roundId },
    include: {
      entries: {
        where: { stakeStatus: 'CONFIRMED' },
        include: {
          player: { select: { id: true, nimiqAddress: true, displayName: true } },
        },
      },
      questions: true,
      answers: true,
      payouts: true,
    },
  })

  if (!round) return null

  if ((round.status === 'AWAITING_PAYOUT' || round.status === 'COMPLETED') && (round.payouts.length > 0 || round.entries.length === 0)) {
    return round
  }

  const entriesWithAnswers = round.entries.map((entry) => {
    const answers = round.answers.filter((a) => a.playerId === entry.playerId)
    return { ...entry, answers }
  })

  const leaderboard = computeLeaderboard(entriesWithAnswers)
  const isZeroScore = leaderboard.length > 0 && leaderboard.every((l) => l.correctCount === 0)

  let winners: any[] = []
  let payouts: any[] = []
  let nextStatus: 'AWAITING_PAYOUT' | 'COMPLETED' = 'COMPLETED'

  if (isZeroScore) {
    payouts = round.entries.map((e) => ({
      recipientId: e.playerId,
      amount: Number(round.stakeAmount),
    }))
    nextStatus = payouts.length > 0 ? 'AWAITING_PAYOUT' : 'COMPLETED'
  } else {
    winners = determineWinners(leaderboard, round.payoutRule)
    const pot = Number(round.stakeAmount) * entriesWithAnswers.length
    payouts = computePayouts(winners, pot, round.payoutRule)
    nextStatus = payouts.length > 0 ? 'AWAITING_PAYOUT' : 'COMPLETED'
  }

  await prisma.$transaction(async (tx) => {
    await tx.triviaRound.update({
      where: { id: roundId },
      data: { status: nextStatus },
    })

    if (payouts.length > 0) {
      await tx.payout.deleteMany({ where: { roundId } })
      await tx.payout.createMany({
        data: payouts.map((p) => ({
          roundId,
          recipientId: p.recipientId,
          amount: p.amount,
          status: 'PENDING',
        })),
      })
    }
  })

  return await prisma.triviaRound.findUnique({
    where: { id: roundId },
    include: {
      host: { select: { id: true, nimiqAddress: true, displayName: true } },
      entries: {
        include: { player: { select: { id: true, nimiqAddress: true, displayName: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      questions: { orderBy: { orderIndex: 'asc' } },
      payouts: {
        include: { recipient: { select: { id: true, nimiqAddress: true, displayName: true } } },
      },
    },
  })
}

