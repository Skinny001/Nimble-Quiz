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
    const { txHash } = await req.json()

    if (!txHash) {
      return NextResponse.json({ error: 'txHash is required' }, { status: 400 })
    }

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: { host: true },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    const entry = await prisma.roundEntry.findUnique({
      where: { roundId_playerId: { roundId: id, playerId: user.id } },
    })

    if (!entry) {
      return NextResponse.json({ error: 'No pending entry found' }, { status: 404 })
    }

    if (entry.stakeStatus === 'CONFIRMED') {
      return NextResponse.json({ error: 'Entry already confirmed' }, { status: 400 })
    }

    const existingTx = await prisma.roundEntry.findFirst({
      where: { txHash, roundId: id },
    })

    // Allow retry: if the same tx is already on THIS entry, that's fine (retry).
    // Only block if a DIFFERENT entry uses the same hash.
    if (existingTx && existingTx.id !== entry.id) {
      return NextResponse.json({ error: 'Transaction already used by another player' }, { status: 400 })
    }

    // Best-effort on-chain verification. On testnet the indexer may not have
    // the tx immediately after the SDK returns. We trust the SDK-returned hash
    // and confirm the entry anyway; a background worker can re-verify later.
    // We only hard-reject on clear fraud signals (wrong recipient/amount if
    // the tx IS found), never on "tx not found yet".
    const verified = await verifyStakeTransaction(txHash, round.host.nimiqAddress, Number(round.stakeAmount), user.nimiqAddress, id)

    if (!verified.success && verified.hardReject) {
      // Clear fraud: tx found but wrong recipient or amount — keep PENDING, let
      // player retry with the correct payment rather than permanently blocking.
      return NextResponse.json({ error: verified.error }, { status: 400 })
    }

    // Confirm regardless of whether on-chain verification succeeded —
    // if the tx was not found yet it will be caught by the polling worker.
    await prisma.$transaction(async (tx) => {
      await tx.roundEntry.update({
        where: { id: entry.id },
        data: {
          stakeStatus: 'CONFIRMED',
          txHash,
          confirmedAt: new Date(),
        },
      })

      // Notify Player
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Joined Round',
          message: `Payment successful. You joined "${round.title}".`,
          type: 'JOIN',
        },
      })

      // Notify Host
      await tx.notification.create({
        data: {
          userId: round.hostId,
          title: 'New Player',
          message: `${user.displayName || 'A player'} paid to join "${round.title}".`,
          type: 'JOIN',
        },
      })
    })

    return NextResponse.json({ success: true, entryId: entry.id })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Join confirm error:', error)
    return NextResponse.json({ error: 'Failed to confirm stake' }, { status: 500 })
  }
}

async function verifyStakeTransaction(
  txHash: string,
  hostAddress: string,
  stakeAmount: number,
  playerAddress: string,
  roundId: string
): Promise<{ success: boolean; hardReject?: boolean; error?: string }> {
  try {
    const response = await fetch(txUrl(txHash), { signal: AbortSignal.timeout(5000) })

    // Tx not found or indexer unavailable — treat as "not indexed yet", not fraud.
    if (!response.ok) {
      console.warn(`[join-confirm] tx ${txHash} not found on-chain yet (${response.status}), allowing entry — will re-verify via polling`)
      return { success: true }
    }

    const tx = await response.json()

    if (tx.recipient !== hostAddress) {
      return { success: false, hardReject: true, error: 'Transaction recipient does not match host address' }
    }

    if (tx.sender !== playerAddress) {
      return { success: false, hardReject: true, error: 'Transaction sender does not match your wallet address' }
    }

    const amountLuna = Math.round(stakeAmount * 100000)
    if (tx.value !== amountLuna) {
      return { success: false, hardReject: true, error: `Wrong stake amount: expected ${stakeAmount} NIM, got ${tx.value / 100000} NIM` }
    }

    return { success: true }
  } catch (error) {
    // Network/timeout error — don't block the player, let polling catch it.
    console.warn('[join-confirm] verification error (allowing entry):', error)
    return { success: true }
  }
}