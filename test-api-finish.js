require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const round = await prisma.triviaRound.findFirst({
    where: { status: 'SCORING' },
    orderBy: { createdAt: 'desc' }
  });
  if (!round) return console.log("No scoring rounds found");

  const hostUser = await prisma.user.findUnique({ where: { id: round.hostId } });
  const sessionToken = Buffer.from(JSON.stringify({ userId: hostUser.id, address: hostUser.nimiqAddress })).toString('base64');

  const res = await fetch(`http://localhost:3000/api/v1/rounds/${round.id}/finish`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${sessionToken}` }
  });
  console.log(res.status);
  console.log(await res.text());
}
run().catch(console.error).finally(() => prisma.$disconnect());
