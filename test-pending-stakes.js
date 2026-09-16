require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const pending = await prisma.roundEntry.findMany({
    where: { stakeStatus: 'PENDING' },
    include: {
      player: { select: { nimiqAddress: true, displayName: true } },
      round: { include: { host: { select: { nimiqAddress: true } } } }
    }
  });

  if (pending.length === 0) {
    console.log("No pending stakes found in DB.");
    return;
  }
  
  console.log(`Found ${pending.length} pending stakes in DB.`);

  for (const entry of pending) {
    const hostAddress = entry.round.host.nimiqAddress;
    const playerAddress = entry.player.nimiqAddress;
    const expectedLuna = Math.round(Number(entry.round.stakeAmount) * 100000);
    const roundId = entry.roundId;

    console.log(`Checking blockchain for entry ${entry.id} (Player: ${playerAddress})...`);
    
    // Check from host's perspective
    const response = await fetch(`https://v2.nimiqwatch.com/api/v1/account/${hostAddress.replace(/\s+/g, '')}`);
    if (!response.ok) {
      console.log('Failed to fetch from Nimiq API');
      continue;
    }

    const data = await response.json();
    const transactions = data.transactions || [];
    
    let found = false;
    for (const tx of transactions) {
      const txAny = tx;
      if ((txAny.recipient || '').replace(/\s+/g, '') === (hostAddress || '').replace(/\s+/g, '') &&
          (txAny.sender || '').replace(/\s+/g, '') === (playerAddress || '').replace(/\s+/g, '') &&
          tx.value === expectedLuna &&
          tx.data?.includes(`round:${roundId}`)) {
        
        console.log(`Found transaction ${tx.hash} on blockchain! Confirming stake...`);
        await prisma.roundEntry.update({
          where: { id: entry.id },
          data: { stakeStatus: 'CONFIRMED', txHash: tx.hash, confirmedAt: new Date() }
        });
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`No matching transaction found on the blockchain for player ${playerAddress}. The player needs to send the payment.`);
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
