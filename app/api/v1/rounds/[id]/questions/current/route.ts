import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: {
        entries: { where: { playerId: user.id, stakeStatus: 'CONFIRMED' } },
        questions: { orderBy: { orderIndex: 'asc' } },
        answers: { where: { playerId: user.id } },
      },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.entries.length === 0) {
      return NextResponse.json({ error: 'Not a confirmed participant' }, { status: 403 })
    }

    if (round.status !== 'IN_PROGRESS' || !round.startedAt) {
      if (round.status === 'SCORING' || round.status === 'AWAITING_PAYOUT' || round.status === 'COMPLETED') {
        return NextResponse.json({ finished: true })
      }
      return NextResponse.json({ error: 'Round not in progress' }, { status: 400 })
    }

    const elapsedMs = Date.now() - round.startedAt.getTime()
    const msPerQuestion = round.timePerQuestionSeconds * 1000
    const currentIndex = Math.floor(elapsedMs / msPerQuestion)

    if (currentIndex >= round.questions.length) {
      if (round.status === 'IN_PROGRESS') {
        await prisma.triviaRound.update({ where: { id }, data: { status: 'SCORING' } })
      }
      return NextResponse.json({ finished: true })
    }

    const currentQuestion = round.questions[currentIndex]
    const timeRemaining = Math.max(0, Math.ceil((msPerQuestion - (elapsedMs % msPerQuestion)) / 1000))

    return NextResponse.json({
      question: {
        id: currentQuestion.id,
        prompt: currentQuestion.prompt,
        options: currentQuestion.options,
        orderIndex: currentQuestion.orderIndex,
        totalQuestions: round.questionCount,
      },
      timeRemaining,
      currentIndex,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get current question error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}