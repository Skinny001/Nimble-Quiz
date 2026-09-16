require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const stuck = await prisma.triviaRound.findMany({ where: { status: 'SCORING' } });
  for (const r of stuck) {
    await prisma.triviaRound.update({ where: { id: r.id }, data: { status: 'AWAITING_PAYOUT' } });
    console.log(`Updated ${r.id} to AWAITING_PAYOUT`);
  }
}
fix().catch(console.error).finally(() => prisma.$disconnect());
