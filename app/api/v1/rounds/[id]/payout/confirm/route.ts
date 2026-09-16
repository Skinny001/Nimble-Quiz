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

      const payout = await prisma.payout.findUnique({
        where: { id: payoutId },
        include: { recipient: true },
      })
      if (!payout || payout.roundId !== id) {
        results.push({ payoutId, success: false, error: 'Payout not found' })
        continue
      }

      if (payout.status === 'CONFIRMED') {
        results.push({ payoutId, success: true, alreadyConfirmed: true })
        continue
      }

      // Best-effort on-chain verification.
      // If the tx isn't indexed yet, mark as SENT (not CONFIRMED) so the UI
      // shows "Paid" immediately and a background worker confirms it later.
      // Only hard-reject on clear fraud (wrong sender/recipient/amount when tx IS found).
      const verified = await verifyPayoutTransaction(
        txHash,
        round.host.nimiqAddress,
        payout.recipientId,
        Number(payout.amount)
      )

      if (verified.hardReject) {
        results.push({ payoutId, success: false, error: verified.error })
        continue
      }

      // Mark as SENT immediately; background worker will upgrade to CONFIRMED
      const newStatus = verified.confirmed ? 'CONFIRMED' : 'SENT'

      await prisma.$transaction(async (tx) => {
        await tx.payout.update({
          where: { id: payoutId },
          data: {
            txHash,
            status: newStatus,
            ...(newStatus === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
          },
        })

        // Notify the winner
        const isRefund = round.payouts.length > 1 &&
          round.payouts.every(p => Number(p.amount) === Number(round.payouts[0].amount))
        await tx.notification.create({
          data: {
            userId: payout.recipientId,
            title: isRefund ? 'Stake Refunded!' : 'Prize Received!',
            message: isRefund
              ? `Your ${Number(payout.amount)} NIM stake was refunded for "${round.title}".`
              : `You received ${Number(payout.amount)} NIM for winning "${round.title}".`,
            type: 'PAYOUT',
          },
        })

        // Notify the host that this payment was sent
        await tx.notification.create({
          data: {
            userId: round.hostId,
            title: 'Payment Sent',
            message: `You sent ${Number(payout.amount)} NIM to ${payout.recipient.displayName ?? payout.recipient.nimiqAddress.slice(0, 10) + '…'} for "${round.title}".`,
            type: 'PAYOUT',
          },
        })
      })

      results.push({ payoutId, success: true, status: newStatus })
    }

    // Mark round COMPLETED once all payouts have a txHash submitted
    // (don't wait for blockchain confirmation — the background worker handles that)
    const stillPending = await prisma.payout.findMany({
      where: { roundId: id, txHash: null },
    })

    if (stillPending.length === 0) {
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
): Promise<{ confirmed?: boolean; hardReject?: boolean; error?: string }> {
  try {
    const recipient = await prisma.user.findUnique({ where: { id: recipientId } })
    if (!recipient) return { hardReject: true, error: 'Recipient not found' }

    const response = await fetch(txUrl(txHash), { signal: AbortSignal.timeout(2500) })

    // Tx not indexed yet — allow as SENT, background worker will confirm later
    if (!response.ok) {
      console.warn(`[payout-confirm] tx ${txHash} not yet indexed (${response.status}), marking SENT`)
      return { confirmed: false }
    }

    const tx: any = await response.json()

    const cleanSender = (tx.sender || '').replace(/\s+/g, '')
    const cleanHost = (hostAddress || '').replace(/\s+/g, '')
    if (cleanSender !== cleanHost) {
      return { hardReject: true, error: 'Transaction sender does not match host' }
    }

    const cleanRecipient = (tx.recipient || '').replace(/\s+/g, '')
    const cleanWinner = (recipient.nimiqAddress || '').replace(/\s+/g, '')
    if (cleanRecipient !== cleanWinner) {
      return { hardReject: true, error: 'Transaction recipient does not match winner' }
    }

    const expectedLuna = Math.round(expectedAmount * 100000)
    if (tx.value !== expectedLuna) {
      return { hardReject: true, error: `Amount mismatch: expected ${expectedLuna} luna, got ${tx.value}` }
    }

    return { confirmed: true }
  } catch (error) {
    // Network/timeout — treat as not indexed yet, allow as SENT
    console.warn('[payout-confirm] verification timeout, marking SENT:', error)
    return { confirmed: false }
  }
}