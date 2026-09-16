require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function computeLeaderboard(entriesWithAnswers) {
  const lb = entriesWithAnswers.map(entry => {
    let score = 0;
    let totalTime = 0;
    for (const ans of entry.answers) {
      if (ans.isCorrect) score += 1;
      totalTime += ans.responseTimeMs || 0;
    }
    return {
      playerId: entry.playerId,
      score,
      totalTime,
    };
  });
  lb.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTime - b.totalTime;
  });
  return lb;
}

function determineWinners(leaderboard, payoutRule) {
  if (leaderboard.length === 0) return [];
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const topScore = leaderboard[0].score;
    if (topScore === 0) return [];
    const topTime = leaderboard[0].totalTime;
    return leaderboard.filter(p => p.score === topScore && p.totalTime === topTime);
  }
  const winners = [];
  let currentRank = 0;
  let currentScore = -1;
  let currentTime = -1;
  for (const p of leaderboard) {
    if (p.score === 0) continue;
    if (p.score !== currentScore || p.totalTime !== currentTime) {
      currentRank++;
      currentScore = p.score;
      currentTime = p.totalTime;
    }
    if (currentRank > 3) break;
    winners.push(p);
  }
  return winners;
}

function computePayouts(winners, pot, payoutRule) {
  if (winners.length === 0) return [];
  if (payoutRule === 'WINNER_TAKE_ALL') {
    const share = pot / winners.length;
    return winners.map(w => ({ recipientId: w.playerId, amount: share }));
  }
  const weights = [0.5, 0.3, 0.2];
  const totalWeight = winners.reduce((sum, _, i) => sum + (weights[i] || 0), 0);
  return winners.map((w, i) => ({
    recipientId: w.playerId,
    amount: Math.round((pot * (weights[i] || 0) / totalWeight) * 100) / 100,
  }));
}

async function run() {
  const id = "e1699a4e-6cc7-496c-ae6b-3707455d72d9";
  const round = await prisma.triviaRound.findUnique({
    where: { id },
    include: {
      entries: {
        where: { stakeStatus: 'CONFIRMED' },
        include: { player: true },
      },
    },
  });

  const entriesWithAnswers = await Promise.all(
    round.entries.map(async (entry) => {
      const answers = await prisma.answer.findMany({
        where: { roundId: id, playerId: entry.playerId },
      });
      return { ...entry, answers };
    })
  );

  const leaderboard = computeLeaderboard(entriesWithAnswers);
  const winners = determineWinners(leaderboard, round.payoutRule);
  const pot = Number(round.stakeAmount) * entriesWithAnswers.length;
  const payouts = computePayouts(winners, pot, round.payoutRule);
  
  console.log("Updating DB with payouts:", payouts);

  await prisma.$transaction(async (tx) => {
    await tx.triviaRound.update({
      where: { id },
      data: { status: payouts.length > 0 ? 'AWAITING_PAYOUT' : 'COMPLETED' },
    });

    if (payouts.length > 0) {
      await tx.payout.createMany({
        data: payouts.map(p => ({
          roundId: id,
          recipientId: p.recipientId,
          amount: p.amount.toString(),
        })),
      });
    }
  });

  console.log("Success!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
