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
    const { questionId, selectedOptionIndex } = await req.json()

    if (!questionId || selectedOptionIndex === undefined) {
      return NextResponse.json({ error: 'questionId and selectedOptionIndex required' }, { status: 400 })
    }

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: {
        entries: { where: { playerId: user.id, stakeStatus: 'CONFIRMED' } },
        questions: { where: { id: questionId } },
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

    const question = round.questions[0]
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const questionStartTime = round.startedAt ? round.startedAt.getTime() + (question.orderIndex * round.timePerQuestionSeconds * 1000) : Date.now()
    
    const existingAnswer = await prisma.answer.findUnique({
      where: { questionId_playerId: { questionId, playerId: user.id } },
    })

    if (existingAnswer) {
      return NextResponse.json({ error: 'Already answered this question' }, { status: 400 })
    }

    const isCorrect = selectedOptionIndex === question.correctOptionIndex
    const responseTimeMs = isCorrect ? Date.now() - questionStartTime : round.timePerQuestionSeconds * 1000

    await prisma.answer.create({
      data: {
        roundId: id,
        questionId,
        playerId: user.id,
        selectedOptionIndex,
        isCorrect,
        responseTimeMs: isCorrect ? responseTimeMs : round.timePerQuestionSeconds * 1000,
      },
    })

    return NextResponse.json({
      success: true,
      isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      responseTimeMs,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Submit answer error:', error)
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
  }
}

async function checkRoundComplete(roundId: string) {
  const round = await prisma.triviaRound.findUnique({
    where: { id: roundId },
    include: {
      entries: { where: { stakeStatus: 'CONFIRMED' } },
    },
  })

  if (!round) return

  const allPlayersDone = await Promise.all(
    round.entries.map(async (entry) => {
      const answered = await prisma.answer.count({
        where: { roundId, playerId: entry.playerId },
      })
      return answered >= round.questionCount
    })
  )

  if (allPlayersDone.every(done => done)) {
    await prisma.triviaRound.update({
      where: { id: roundId },
      data: { status: 'SCORING' },
    })
  }
}