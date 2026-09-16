require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { computeLeaderboard, determineWinners, computePayouts } = require('./lib/scoring');

const prisma = new PrismaClient();

async function run() {
  const id = "e1699a4e-6cc7-496c-ae6b-3707455d72d9";

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
  console.log("Leaderboard:", leaderboard);

  const winners = determineWinners(leaderboard, round.payoutRule);
  console.log("Winners:", winners);

  const pot = Number(round.stakeAmount) * entriesWithAnswers.length;
  const payouts = computePayouts(winners, pot, round.payoutRule);
  console.log("Payouts:", payouts);

  // If this throws an error, we know why finish() failed!
}

run().catch(console.error).finally(() => prisma.$disconnect());
