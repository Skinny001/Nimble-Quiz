import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { nimiqAddress } = await req.json()

    if (!nimiqAddress || typeof nimiqAddress !== 'string') {
      return NextResponse.json({ error: 'nimiqAddress is required' }, { status: 400 })
    }

    const user = await prisma.user.upsert({
      where: { nimiqAddress },
      update: {},
      create: { nimiqAddress },
    })

    const sessionToken = Buffer.from(JSON.stringify({ userId: user.id, address: user.nimiqAddress })).toString('base64')

    return NextResponse.json({
      sessionToken,
      user: {
        id: user.id,
        nimiqAddress: user.nimiqAddress,
        displayName: user.displayName,
      },
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}