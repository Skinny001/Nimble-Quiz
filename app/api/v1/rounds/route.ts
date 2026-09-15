import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

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

    const token = await getSessionToken()
    let questions: TriviaQuestion[] = []

    if (token) {
      questions = await fetchQuestionsWithToken(
        token,
        category,
        questionCount,
        categoryMode
      )
    }

    if (questions.length < questionCount) {
      console.warn(`[create] OpenTDB failed to return ${questionCount} questions. Falling back to default bank.`)
      questions = [...FALLBACK_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, questionCount)
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
        questions: {
          create: questions.map((q, i) => ({
            prompt: q.prompt,
            options: q.options,
            correctOptionIndex: q.correctIndex,
            orderIndex: i,
          }))
        }
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

const FALLBACK_QUESTIONS: TriviaQuestion[] = [
  { prompt: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctIndex: 2 },
  { prompt: "What is the largest planet in our solar system?", options: ["Mars", "Jupiter", "Saturn", "Earth"], correctIndex: 1 },
  { prompt: "Which element has the chemical symbol 'O'?", options: ["Gold", "Oxygen", "Osmium", "Iron"], correctIndex: 1 },
  { prompt: "What year did the Titanic sink?", options: ["1912", "1905", "1898", "1923"], correctIndex: 0 },
  { prompt: "Who painted the Mona Lisa?", options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Claude Monet"], correctIndex: 2 },
  { prompt: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctIndex: 2 },
  { prompt: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
  { prompt: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correctIndex: 1 },
  { prompt: "How many continents are there?", options: ["5", "6", "7", "8"], correctIndex: 2 },
  { prompt: "What is the largest ocean on Earth?", options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"], correctIndex: 3 }
]

async function getSessionToken(): Promise<string | null> {
  try {
    const res = await fetch(`${OPENTDB_BASE}/api_token.php?command=request`)
    const data = await res.json()
    if (data.response_code === 0 && data.token) return data.token
    return null
  } catch { return null }
}

async function fetchQuestionsWithToken(token: string, category: string, count: number, mode: string): Promise<TriviaQuestion[]> {
  try {
    let categoryIds: number[] = mode === 'MIXED' ? Object.values(CATEGORIES) : [CATEGORIES[category] || 9]
    const allQuestions: TriviaQuestion[] = []

    for (const catId of categoryIds) {
      const remaining = count - allQuestions.length
      if (remaining <= 0) break

      const params = new URLSearchParams({ amount: String(Math.min(remaining, 50)), token, difficulty: 'medium', type: 'multiple' })
      if (mode === 'SINGLE') params.set('category', String(catId))

      const res = await fetch(`${OPENTDB_BASE}/api.php?${params.toString()}`)
      const data = await res.json()

      if (data.response_code === 1) break
      if (data.response_code === 3 || data.response_code === 4) break

      if (data.response_code === 0 && data.results) {
        for (const q of data.results) {
          const decodedCorrect = decodeHtml(q.correct_answer)
          const options = [...q.incorrect_answers.map(decodeHtml), decodedCorrect].sort(() => Math.random() - 0.5)
          allQuestions.push({ prompt: decodeHtml(q.question), options, correctIndex: options.findIndex(o => o === decodedCorrect), category: decodeHtml(q.category) })
          if (allQuestions.length >= count) break
        }
      }
    }
    return allQuestions.slice(0, count)
  } catch { return [] }
}

function decodeHtml(html: string): string {
  return html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
}
