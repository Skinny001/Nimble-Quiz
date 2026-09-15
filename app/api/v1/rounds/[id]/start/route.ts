import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

const OPENTDB_BASE = 'https://opentdb.com'
const CATEGORIES: Record<string, number> = {
  'General Knowledge': 9,
  'Books': 10,
  'Film': 11,
  'Music': 12,
  'Musicals & Theatres': 13,
  'Television': 14,
  'Video Games': 15,
  'Board Games': 16,
  'Science & Nature': 17,
  'Computers': 18,
  'Mathematics': 19,
  'Mythology': 20,
  'Sports': 21,
  'Geography': 22,
  'History': 23,
  'Politics': 24,
  'Art': 25,
  'Celebrities': 26,
  'Animals': 27,
  'Vehicles': 28,
  'Comics': 29,
  'Gadgets': 30,
  'Japanese Anime & Manga': 31,
  'Cartoon & Animations': 32,
}

interface TriviaQuestion {
  prompt: string
  options: string[]
  correctIndex: number
  category?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(req)
    const { id } = await params

    const round = await prisma.triviaRound.findUnique({
      where: { id },
      include: { entries: { where: { stakeStatus: 'CONFIRMED' } } },
    })

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 })
    }

    if (round.hostId !== user.id) {
      return NextResponse.json({ error: 'Only host can start the round' }, { status: 403 })
    }

    if (round.status !== 'OPEN') {
      return NextResponse.json({ error: 'Round cannot be started' }, { status: 400 })
    }

    if (round.entries.length < round.minPlayers) {
      return NextResponse.json({ error: `Need at least ${round.minPlayers} confirmed players` }, { status: 400 })
    }

    const token = await getSessionToken()
    if (!token) {
      return NextResponse.json({ error: 'Failed to get session token from Open Trivia DB' }, { status: 500 })
    }

    const questions = await fetchQuestionsWithToken(
      token,
      round.category,
      round.questionCount,
      round.categoryMode
    )

    if (questions.length < round.questionCount) {
      return NextResponse.json({ error: 'Failed to fetch enough questions' }, { status: 500 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.question.createMany({
        data: questions.map((q, i) => ({
          roundId: id,
          prompt: q.prompt,
          options: q.options,
          correctOptionIndex: q.correctIndex,
          orderIndex: i,
        })),
      })

      await tx.triviaRound.update({
        where: { id },
        data: { status: 'IN_PROGRESS' },
      })
    })

    return NextResponse.json({ success: true, questionCount: questions.length })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Start round error:', error)
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 })
  }
}

async function getSessionToken(): Promise<string | null> {
  try {
    const res = await fetch(`${OPENTDB_BASE}/api_token.php?command=request`)
    const data = await res.json()
    if (data.response_code === 0 && data.token) {
      return data.token
    }
    console.error('Failed to get session token:', data)
    return null
  } catch (error) {
    console.error('Session token request error:', error)
    return null
  }
}

async function fetchQuestionsWithToken(
  token: string,
  category: string,
  count: number,
  mode: string
): Promise<TriviaQuestion[]> {
  try {
    let categoryIds: number[]

    if (mode === 'MIXED') {
      categoryIds = Object.values(CATEGORIES)
    } else {
      const catId = CATEGORIES[category] || 9
      categoryIds = [catId]
    }

    const allQuestions: TriviaQuestion[] = []

    for (const catId of categoryIds) {
      const remaining = count - allQuestions.length
      if (remaining <= 0) break

      const params = new URLSearchParams({
        amount: String(Math.min(remaining, 50)),
        token,
        difficulty: 'medium',
        type: 'multiple',
      })

      if (mode === 'SINGLE') {
        params.set('category', String(catId))
      }

      const url = `${OPENTDB_BASE}/api.php?${params.toString()}`
      const res = await fetch(url)
      const data: {
        response_code: number
        results?: Array<{
          question: string
          correct_answer: string
          incorrect_answers: string[]
          category: string
        }>
      } = await res.json()

      if (data.response_code === 1) {
        break
      }
      if (data.response_code === 3) {
        console.warn('Token not found, getting new token')
        return []
      }
      if (data.response_code === 4) {
        console.warn('Token exhausted, no more unique questions available')
        break
      }

      if (data.response_code === 0 && data.results) {
        for (const q of data.results) {
          const decodedCorrect = decodeHtml(q.correct_answer)
          const decodedIncorrect = q.incorrect_answers.map(decodeHtml)
          const options = [...decodedIncorrect, decodedCorrect]
            .sort(() => Math.random() - 0.5)

          allQuestions.push({
            prompt: decodeHtml(q.question),
            options,
            correctIndex: options.findIndex(o => o === decodedCorrect),
            category: decodeHtml(q.category),
          })

          if (allQuestions.length >= count) break
        }
      }
    }

    return allQuestions.slice(0, count)
  } catch (error) {
    console.error('Fetch questions error:', error)
    return []
  }
}

function decodeHtml(html: string): string {
  return html
    .replace(/"/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
}