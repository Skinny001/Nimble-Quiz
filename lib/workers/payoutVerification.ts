import { prisma } from '@/lib/prisma'
import { addressTxsUrl } from '@/lib/chain'

export async function verifyPendingPayouts() {
  const rounds = await prisma.triviaRound.findMany({
    where: { status: 'AWAITING_PAYOUT' },
    include: {
      host: true,
      payouts: {
        where: { status: { in: ['PENDING', 'SENT'] } },
        include: { recipient: true },
      },
    },
  })

  for (const round of rounds) {
    for (const payout of round.payouts) {
      try {
        const verified = await scanForPayoutTransaction(
          round.host.nimiqAddress,
          payout.recipient.nimiqAddress,
          Number(payout.amount)
        )

        if (verified) {
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              txHash: verified.txHash,
              status: 'CONFIRMED',
              confirmedAt: new Date(),
            },
          })
          console.log(`Confirmed payout ${payout.id} in round ${round.id}`)
        }
      } catch (error) {
        console.error(`Error verifying payout ${payout.id}:`, error)
      }
    }

    const unconfirmed = await prisma.payout.count({
      where: { roundId: round.id, status: { not: 'CONFIRMED' } },
    })

    if (unconfirmed === 0) {
      await prisma.triviaRound.update({
        where: { id: round.id },
        data: { status: 'COMPLETED' },
      })
      console.log(`Round ${round.id} marked as COMPLETED`)
    }
  }
}

async function scanForPayoutTransaction(
  hostAddress: string,
  recipientAddress: string,
  expectedAmount: number
): Promise<{ txHash: string } | null> {
  try {
    const expectedLuna = Math.round(expectedAmount * 100000)
    const response = await fetch(addressTxsUrl(hostAddress))
    if (!response.ok) return null

    const data = await response.json()
    const transactions = data.transactions || []

    for (const tx of transactions) {
      const cleanTxSender = tx.sender.replace(/\s+/g, '')
      const cleanHost = hostAddress.replace(/\s+/g, '')
      const cleanTxRecipient = tx.recipient.replace(/\s+/g, '')
      const cleanRecipient = recipientAddress.replace(/\s+/g, '')

      if (cleanTxSender === cleanHost &&
          cleanTxRecipient === cleanRecipient &&
          tx.value === expectedLuna) {

        const existing = await prisma.payout.findFirst({ where: { txHash: tx.hash } })
        if (!existing) {
          return { txHash: tx.hash }
        }
      }
    }
  } catch (error) {
    console.error('Payout scan error:', error)
  }
  return null
}