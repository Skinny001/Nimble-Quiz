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

    const startedAt = new Date(Date.now() + 3000) // 3-second buffer for players to sync

    await prisma.triviaRound.update({
      where: { id },
      data: { status: 'IN_PROGRESS', startedAt },
    })

    return NextResponse.json({ success: true, startedAt })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Start round error:', error)
    return NextResponse.json({ error: 'Failed to start round' }, { status: 500 })
  }
}