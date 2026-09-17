import { prisma } from '@/lib/prisma'
import { finalizeRound } from '@/lib/scoring'

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
    },
  })

  for (const round of stuckRounds) {
    // Determine the last activity time
    const lastActivity = round.answers.length > 0 
      ? round.answers[0].answeredAt 
      : round.createdAt

    if (lastActivity < oneMinuteAgo) {
      console.log(`Round ${round.id} abandoned for 1+ min. Force-completing...`)
      try {
        await finalizeRound(round.id)
        console.log(`Round ${round.id} successfully force-completed.`)
      } catch (error) {
        console.error(`Failed to force-complete round ${round.id}:`, error)
      }
    }
  }
}
