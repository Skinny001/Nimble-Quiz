import { prisma } from '@/lib/prisma'
import { computeLeaderboard, determineWinners, computePayouts } from '@/lib/scoring'

// Closes rounds stuck in IN_PROGRESS or SCORING where the last answer was more than 1 minute ago.
export async function verifyAbandonedRounds() {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000)

  const stuckRounds = await prisma.triviaRound.findMany({
    where: {
      status: { in: ['IN_PROGRESS', 'SCORING'] },
    },
    include: {
      answers: {
        orderBy: { answeredAt: 'desc' },
        take: 1,
      },
      entries: {
        where: { stakeStatus: 'CONFIRMED' },
        include: {
          player: { select: { id: true, nimiqAddress: true, displayName: true } },
        },
      },
    },
  })

  for (const round of stuckRounds) {
    // Determine the last activity time
    const lastActivity = round.answers.length > 0 
      ? round.answers[0].answeredAt 
      : round.createdAt

    if (lastActivity < oneMinuteAgo) {
      console.log(`Round ${round.id} abandoned for 1+ min. Force-completing...`)

      // We need to fetch all answers to score properly
      const entriesWithAnswers = await Promise.all(
        round.entries.map(async (entry) => {
          const answers = await prisma.answer.findMany({
            where: { roundId: round.id, playerId: entry.playerId },
          })
          return { ...entry, answers }
        })
      )

      const leaderboard = computeLeaderboard(entriesWithAnswers)
      const winners = determineWinners(leaderboard, round.payoutRule)
      const pot = Number(round.stakeAmount) * entriesWithAnswers.length
      const payouts = computePayouts(winners, pot, round.payoutRule)

      try {
        await prisma.$transaction(async (tx) => {
          await tx.triviaRound.update({
            where: { id: round.id },
            data: { status: 'AWAITING_PAYOUT' },
          })

          if (payouts.length > 0) {
            await tx.payout.createMany({
              data: payouts.map(p => ({
                roundId: round.id,
                recipientId: p.recipientId,
                amount: p.amount,
                status: 'PENDING',
              })),
            })
          }
        })
        console.log(`Round ${round.id} successfully force-completed.`)
      } catch (error) {
        console.error(`Failed to force-complete round ${round.id}:`, error)
      }
    }
  }
}
