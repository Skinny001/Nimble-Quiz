import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const rounds = await prisma.triviaRound.findMany({
      where: status ? { status: status as any } : {},
      include: {
        host: { select: { id: true, nimiqAddress: true, displayName: true } },
        entries: { where: { stakeStatus: 'CONFIRMED' }, select: { id: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(rounds.map(r => ({
      ...r,
      stakeAmount: Number(r.stakeAmount),
      confirmedEntries: r.entries.length,
      host: r.host,
    })))
  } catch (error) {
    console.error('Get rounds error:', error)
    return NextResponse.json({ error: 'Failed to fetch rounds' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      title,
      category,
      stakeAmount,
      questionCount,
      timePerQuestionSeconds,
      payoutRule = 'TOP3_SPLIT',
      maxPlayers = 10,
      entryDeadline,
      categoryMode = 'SINGLE',
    } = body

    if (!title || !category || !stakeAmount || !questionCount || !timePerQuestionSeconds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (stakeAmount <= 0) {
      return NextResponse.json({ error: 'Stake amount must be positive' }, { status: 400 })
    }

    if (questionCount < 1 || questionCount > 15) {
      return NextResponse.json({ error: 'Question count must be 1-15' }, { status: 400 })
    }

    if (timePerQuestionSeconds < 10 || timePerQuestionSeconds > 60) {
      return NextResponse.json({ error: 'Time per question must be 10-60 seconds' }, { status: 400 })
    }

    if (maxPlayers < 2 || maxPlayers > 50) {
      return NextResponse.json({ error: 'Max players must be 2-50' }, { status: 400 })
    }

    const round = await prisma.triviaRound.create({
      data: {
        hostId: user.id,
        title,
        category,
        categoryMode,
        stakeAmount,
        questionCount,
        timePerQuestionSeconds,
        payoutRule,
        maxPlayers,
        entryDeadline: entryDeadline ? new Date(entryDeadline) : null,
      },
      include: {
        host: { select: { id: true, nimiqAddress: true, displayName: true } },
      },
    })

    return NextResponse.json({
      ...round,
      stakeAmount: Number(round.stakeAmount),
    }, { status: 201 })
  } catch (error) {
    console.error('Create round error:', error)
    return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
  }
}