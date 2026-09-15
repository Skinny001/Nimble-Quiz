import { NextRequest, NextResponse } from 'next/server'
import { verifyPendingStakes } from '@/lib/workers/stakeVerification'
import { verifyPendingPayouts } from '@/lib/workers/payoutVerification'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await Promise.all([
      verifyPendingStakes(),
      verifyPendingPayouts(),
    ])

    return NextResponse.json({ success: true, timestamp: new Date().toISOString() })
  } catch (error) {
    console.error('Cron verification error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}