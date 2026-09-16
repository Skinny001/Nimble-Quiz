require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const roundId = "10846d2d-fab4-435b-b5c2-27ce27017844";
  const userId = "437af414-216a-47ea-82dd-099de0881f5e"; // Player 2
  const txHash = "dummy-hash-123";

  const round = await prisma.triviaRound.findUnique({
    where: { id: roundId },
    include: { host: true },
  });

  const entry = await prisma.roundEntry.findUnique({
    where: { roundId_playerId: { roundId, playerId: userId } },
  });

  if (!entry) {
    console.log("No pending entry found");
    return;
  }

  const existingTx = await prisma.roundEntry.findFirst({
    where: { txHash, roundId },
  });

  console.log("Validation passed. Updating DB...");

  await prisma.$transaction(async (tx) => {
    await tx.roundEntry.update({
      where: { id: entry.id },
      data: {
        stakeStatus: 'CONFIRMED',
        txHash,
        confirmedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId,
        title: 'Joined Round',
        message: `Payment successful. You joined "${round.title}".`,
        type: 'JOIN',
      },
    });

    await tx.notification.create({
      data: {
        userId: round.hostId,
        title: 'New Player',
        message: `A player paid to join "${round.title}".`,
        type: 'JOIN',
      },
    });
  });

  console.log("Successfully updated DB!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
