import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: {
        host: { select: { id: true, nimiqAddress: true, displayName: true } },
        entries: {
          include: { player: { select: { id: true, nimiqAddress: true, displayName: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        questions: { orderBy: { orderIndex: 'asc' } },
        payouts: {
          include: { recipient: { select: { id: true, nimiqAddress: true, displayName: true } } },
        },
      },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    const isHost = user?.id === round.hostId
    const userEntry = user ? round.entries.find(e => e.playerId === user.id) : null

    return NextResponse.json({
      ...round,
      stakeAmount: Number(round.stakeAmount),
      isHost,
      userEntry: userEntry ? { ...userEntry, player: userEntry.player } : null,
      confirmedEntries: round.entries.filter(e => e.stakeStatus === 'CONFIRMED').length,
      questions: round.status === 'IN_PROGRESS' || round.status === 'SCORING' || round.status === 'AWAITING_PAYOUT' || round.status === 'COMPLETED'
        ? round.questions.map(q => ({ ...q, correctOptionIndex: undefined }))
        : undefined,
    })
  } catch (error) {
    console.error('Get round error:', error)
    return NextResponse.json({ error: 'Failed to fetch round' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: { entries: true },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.hostId !== user.id) {
      return NextResponse.json({ error: 'Only the host can delete this round' }, { status: 403 })
    }

    if (round.status !== 'OPEN') {
      return NextResponse.json({ error: 'Round has already started or finished' }, { status: 400 })
    }

    const hasPaidEntries = round.entries.some(e => e.stakeStatus === 'CONFIRMED')
    if (hasPaidEntries) {
      return NextResponse.json({ error: 'Cannot delete round because a player has already paid. You must start the round.' }, { status: 400 })
    }

    await prisma.triviaRound.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete round error:', error)
    return NextResponse.json({ error: 'Failed to delete round' }, { status: 500 })
  }
}