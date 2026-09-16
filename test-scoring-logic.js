require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function computeLeaderboard(entriesWithAnswers) {
  return entriesWithAnswers.map(entry => {
    const correctCount = entry.answers.filter((a) => a.isCorrect).length
    const totalTime = entry.answers.reduce((sum, a) => sum + a.responseTimeMs, 0)
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

function determineWinners(leaderboard, payoutRule) {
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const topScore = leaderboard[0]?.correctCount || 0
    return leaderboard.filter(p => p.correctCount === topScore)
  }
  return leaderboard.slice(0, 3)
}

function computePayouts(winners, pot, payoutRule) {
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

async function run() {
  const round = await prisma.triviaRound.findUnique({
    where: { id: "10846d2d-fab4-435b-b5c2-27ce27017844" },
    include: {
      entries: {
        where: { stakeStatus: 'CONFIRMED' },
        include: {
          player: { select: { id: true, nimiqAddress: true, displayName: true } },
        },
      },
    },
  });

  const entriesWithAnswers = await Promise.all(
    round.entries.map(async (entry) => {
      const answers = await prisma.answer.findMany({
        where: { roundId: round.id, playerId: entry.playerId },
      });
      return { ...entry, answers };
    })
  );

  const leaderboard = computeLeaderboard(entriesWithAnswers);
  console.log("Leaderboard:", leaderboard);
  const winners = determineWinners(leaderboard, round.payoutRule);
  console.log("Winners:", winners);
  const pot = Number(round.stakeAmount) * round.entries.length;
  console.log("Payouts:", computePayouts(winners, pot, round.payoutRule));
}
run().catch(console.error).finally(() => prisma.$disconnect());
