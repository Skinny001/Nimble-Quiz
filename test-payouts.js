require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const pending = await prisma.payout.findMany({
    where: { status: 'PENDING' },
    include: {
      recipient: { select: { nimiqAddress: true, displayName: true } },
      round: { include: { host: { select: { nimiqAddress: true } } } }
    }
  });
  console.log(JSON.stringify(pending, null, 2));
}
run().catch(console.error).finally(() => prisma.$disconnect());
