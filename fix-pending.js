require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const pending = await prisma.payout.findMany({
    where: { status: 'PENDING' },
    include: {
      recipient: { select: { nimiqAddress: true } },
      round: { include: { host: { select: { nimiqAddress: true } } } }
    }
  });

  for (const payout of pending) {
    const hostAddress = payout.round.host.nimiqAddress;
    const recipientAddress = payout.recipient.nimiqAddress;
    const expectedLuna = Math.round(Number(payout.amount) * 100000);

    console.log(`Checking blockchain for payout ${payout.id}...`);
    const response = await fetch(`https://v2.nimiqwatch.com/api/v1/account/${hostAddress.replace(/\s+/g, '')}`);
    if (!response.ok) {
      console.log('Failed to fetch from Nimiq API');
      continue;
    }

    const data = await response.json();
    const transactions = data.transactions || [];
    
    let found = false;
    for (const tx of transactions) {
      const cleanTxSender = (tx.sender || '').replace(/\s+/g, '');
      const cleanHost = (hostAddress || '').replace(/\s+/g, '');
      const cleanTxRecipient = (tx.recipient || '').replace(/\s+/g, '');
      const cleanRecipient = (recipientAddress || '').replace(/\s+/g, '');

      if (cleanTxSender === cleanHost &&
          cleanTxRecipient === cleanRecipient &&
          tx.value === expectedLuna) {
        
        console.log(`Found transaction ${tx.hash} on blockchain! Confirming payout...`);
        await prisma.payout.update({
          where: { id: payout.id },
          data: { txHash: tx.hash, status: 'CONFIRMED', confirmedAt: new Date() }
        });
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`No matching transaction found on the blockchain for payout ${payout.id}. The host needs to send the payment.`);
    }
  }

  // Check if round should be completed
  if (pending.length > 0) {
    const roundId = pending[0].roundId;
    const remaining = await prisma.payout.count({ where: { roundId, status: 'PENDING' } });
    if (remaining === 0) {
      await prisma.triviaRound.update({ where: { id: roundId }, data: { status: 'COMPLETED' } });
      console.log(`Round ${roundId} is now COMPLETED.`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
