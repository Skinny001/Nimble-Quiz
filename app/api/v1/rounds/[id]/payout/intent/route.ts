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
      include: {
        payouts: {
          include: { recipient: { select: { id: true, nimiqAddress: true, displayName: true } } },
        },
        host: { select: { nimiqAddress: true } },
      },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.hostId !== user.id) {
      return NextResponse.json({ error: 'Only host can initiate payout' }, { status: 403 })
    }

    if (round.status !== 'AWAITING_PAYOUT') {
      return NextResponse.json({ error: 'Round not awaiting payout' }, { status: 400 })
    }

    const pendingPayouts = round.payouts.filter(p => p.status === 'PENDING')

    if (pendingPayouts.length === 0) {
      return NextResponse.json({ error: 'No pending payouts' }, { status: 400 })
    }

    const payoutIntents = pendingPayouts.map(p => ({
      payoutId: p.id,
      recipientAddress: p.recipient.nimiqAddress,
      amount: Math.round(Number(p.amount) * 100000),
      recipientId: p.recipientId,
    }))

    return NextResponse.json({
      hostAddress: round.host.nimiqAddress,
      payouts: payoutIntents,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Payout intent error:', error)
    return NextResponse.json({ error: 'Failed to get payout intent' }, { status: 500 })
  }
}