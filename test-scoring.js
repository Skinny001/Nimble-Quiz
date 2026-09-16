require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const stuck = await prisma.triviaRound.findMany({
    where: { status: 'SCORING' },
    include: {
      entries: {
        include: { player: true }
      },
      answers: true
    }
  });
  console.log(JSON.stringify(stuck, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
