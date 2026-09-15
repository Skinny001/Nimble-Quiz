import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: { host: true, entries: { where: { playerId: user.id } } },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.status !== 'OPEN' && round.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Round is not open for entry' }, { status: 400 })
    }

    if (round.hostId === user.id) {
      return NextResponse.json({ error: 'Host cannot join their own round' }, { status: 400 })
    }

    // If a confirmed entry already exists, block. If PENDING/FAILED, allow retry.
    const existingEntry = round.entries[0]
    if (existingEntry && existingEntry.stakeStatus === 'CONFIRMED') {
      return NextResponse.json({ error: 'Already confirmed in this round' }, { status: 400 })
    }

    const confirmedCount = await prisma.roundEntry.count({
      where: { roundId: id, stakeStatus: 'CONFIRMED' },
    })

    if (confirmedCount >= round.maxPlayers) {
      return NextResponse.json({ error: 'Round is full' }, { status: 400 })
    }

    // Reuse existing PENDING/FAILED entry, or create a new one
    let entry = existingEntry
    if (!entry) {
      entry = await prisma.roundEntry.create({
        data: {
          roundId: id,
          playerId: user.id,
          stakeStatus: 'PENDING',
        },
      })
    } else if (entry.stakeStatus === 'FAILED') {
      // Reset failed entry back to pending for retry
      await prisma.roundEntry.update({
        where: { id: entry.id },
        data: { stakeStatus: 'PENDING', txHash: null },
      })
    }

    const stakeAmountLuna = Math.round(Number(round.stakeAmount) * 100000)

    return NextResponse.json({
      roundId: id,
      recipientAddress: round.host.nimiqAddress,
      amount: stakeAmountLuna,
      entryId: entry.id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Join intent error:', error)
    return NextResponse.json({ error: 'Failed to create join intent' }, { status: 500 })
  }
}