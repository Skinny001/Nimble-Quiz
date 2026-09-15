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

    if (round.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Round not in progress' }, { status: 400 })
    }

    const answeredQuestionIds = new Set(round.answers.map(a => a.questionId))
    const nextQuestion = round.questions.find(q => !answeredQuestionIds.has(q.id))

    if (!nextQuestion) {
      return NextResponse.json({ finished: true })
    }

    return NextResponse.json({
      question: {
        id: nextQuestion.id,
        prompt: nextQuestion.prompt,
        options: nextQuestion.options,
        orderIndex: nextQuestion.orderIndex,
        totalQuestions: round.questionCount,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Get current question error:', error)
    return NextResponse.json({ error: 'Failed to fetch question' }, { status: 500 })
  }
}