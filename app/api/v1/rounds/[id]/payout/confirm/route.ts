import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { txUrl } from '@/lib/chain'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params
    const { payouts } = await req.json()

    if (!Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json({ error: 'Payouts array required' }, { status: 400 })
    }

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: {
        host: true,
        payouts: { include: { recipient: true } },
      },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.hostId !== user.id) {
      return NextResponse.json({ error: 'Only host can confirm payouts' }, { status: 403 })
    }

    if (round.status !== 'AWAITING_PAYOUT') {
      return NextResponse.json({ error: 'Round not awaiting payout' }, { status: 400 })
    }

    const results = []

    for (const payoutData of payouts) {
      const { payoutId, txHash } = payoutData

      if (!payoutId || !txHash) {
        results.push({ payoutId, success: false, error: 'Missing payoutId or txHash' })
        continue
      }

      const payout = await prisma.payout.findUnique({ where: { id: payoutId } })
      if (!payout || payout.roundId !== id) {
        results.push({ payoutId, success: false, error: 'Payout not found' })
        continue
      }

      if (payout.status === 'CONFIRMED') {
        results.push({ payoutId, success: true, alreadyConfirmed: true })
        continue
      }

      const verified = await verifyPayoutTransaction(
        txHash,
        round.host.nimiqAddress,
        payout.recipientId,
        Number(payout.amount)
      )

      if (!verified.success) {
        results.push({ payoutId, success: false, error: verified.error })
        continue
      }

      await prisma.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: payoutId },
          data: { txHash, status: 'CONFIRMED', confirmedAt: new Date() },
        })

        await tx.notification.create({
          data: {
            userId: payout.recipientId,
            title: 'Prize Received!',
            message: `You received ${Number(payout.amount)} NIM for winning "${round.title}".`,
            type: 'PAYOUT',
          },
        })
      })

      results.push({ payoutId, success: true })
    }

    const allConfirmed = await prisma.payout.findMany({
      where: { roundId: id, status: { not: 'CONFIRMED' } },
    })

    if (allConfirmed.length === 0) {
      await prisma.triviaRound.update({
        where: { id },
        data: { status: 'COMPLETED' },
      })
    }

    return NextResponse.json({ results })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Payout confirm error:', error)
    return NextResponse.json({ error: 'Failed to confirm payouts' }, { status: 500 })
  }
}

async function verifyPayoutTransaction(
  txHash: string,
  hostAddress: string,
  recipientId: string,
  expectedAmount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } })
    if (!recipient) return { success: false, error: 'Recipient not found' }

    const response = await fetch(txUrl(txHash))
    if (!response.ok) return { success: false, error: 'Transaction not found on chain' }

    const tx = await response.json()

    const cleanTxSender = tx.sender.replace(/\s+/g, '')
    const cleanHostAddress = hostAddress.replace(/\s+/g, '')
    if (cleanTxSender !== cleanHostAddress) {
      return { success: false, error: 'Transaction sender does not match host' }
    }

    const cleanTxRecipient = tx.recipient.replace(/\s+/g, '')
    const cleanRecipientAddress = recipient.nimiqAddress.replace(/\s+/g, '')
    if (cleanTxRecipient !== cleanRecipientAddress) {
      return { success: false, error: 'Transaction recipient does not match winner' }
    }

    const expectedLuna = Math.round(expectedAmount * 100000)
    if (tx.value !== expectedLuna) {
      return { success: false, error: `Amount mismatch: expected ${expectedLuna} luna, got ${tx.value}` }
    }

    return { success: true }
  } catch (error) {
    console.error('Payout verification error:', error)
    return { success: false, error: 'Failed to verify transaction' }
  }
}