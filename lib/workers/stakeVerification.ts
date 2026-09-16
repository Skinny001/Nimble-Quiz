import { prisma } from '@/lib/prisma'
import { addressTxsUrl } from '@/lib/chain'

export async function verifyPendingStakes() {
  const openRounds = await prisma.triviaRound.findMany({
    where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    include: {
      host: true,
      entries: {
        where: { stakeStatus: 'PENDING' },
        include: { player: true },
      },
    },
  })

  for (const round of openRounds) {
    for (const entry of round.entries) {
      try {
        const verified = await scanForStakeTransaction(
          round.host.nimiqAddress,
          entry.player.nimiqAddress,
          Number(round.stakeAmount),
          round.id
        )

        if (verified) {
          await prisma.roundEntry.update({
            where: { id: entry.id },
            data: {
              stakeStatus: 'CONFIRMED',
              txHash: verified.txHash,
              confirmedAt: new Date(),
            },
          })
          console.log(`Confirmed stake for entry ${entry.id} in round ${round.id}`)
        }
      } catch (error) {
        console.error(`Error verifying stake for entry ${entry.id}:`, error)
      }
    }
  }
}

async function scanForStakeTransaction(
  hostAddress: string,
  playerAddress: string,
  stakeAmount: number,
  roundId: string
): Promise<{ txHash: string } | null> {
  try {
    const amountLuna = Math.round(stakeAmount * 100000)
    const response = await fetch(addressTxsUrl(hostAddress))
    if (!response.ok) return null

    const data = await response.json()
    const transactions = data.transactions || []

    for (const tx of transactions) {
      if (tx.recipient.replace(/\s+/g, '') === hostAddress.replace(/\s+/g, '') &&
          tx.sender.replace(/\s+/g, '') === playerAddress.replace(/\s+/g, '') &&
          tx.value === amountLuna &&
          tx.data?.includes(`round:${roundId}`)) {

        const existing = await prisma.roundEntry.findFirst({ where: { txHash: tx.hash } })
        if (!existing) {
          return { txHash: tx.hash }
        }
      }
    }
  } catch (error) {
    console.error('Scan error:', error)
  }
  return null
}