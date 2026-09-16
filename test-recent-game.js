require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const latestRound = await prisma.triviaRound.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      entries: { include: { player: true } },
      payouts: true,
      answers: true
    }
  });
  console.log(JSON.stringify(latestRound, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
