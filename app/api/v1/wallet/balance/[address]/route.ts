import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rpcBase } from '@/lib/chain'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    if (!address) {
      return NextResponse.json({ balance: 50 })
    }

    // 1. Attempt on-chain Nimiq balance check via RPC/indexer
    let onChainBalance: number | null = null

    try {
      let response = await fetch(`${rpcBase()}/address/${address}`)
      if (response.ok) {
        const data = await response.json()
        const balanceLuna = data.balance ?? (data.data && data.data.balance)
        if (balanceLuna !== undefined && Number(balanceLuna) > 0) {
          onChainBalance = Number(balanceLuna) / 100000
        }
      }

      if (onChainBalance === null) {
        response = await fetch(rpcBase(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'getAccountByAddress',
            params: [address],
            id: 1,
          }),
        })
        if (response.ok) {
          const data = await response.json()
          if (data.result && data.result.data && Number(data.result.data.balance) > 0) {
            onChainBalance = Number(data.result.data.balance) / 100000
          }
        }
      }
    } catch (e) {
      console.warn('RPC balance lookup warning:', e)
    }

    // 2. Compute live in-app ledger balance based on confirmed stakes and payouts
    const user = await prisma.user.findUnique({
      where: { nimiqAddress: address },
      select: { id: true },
    })

    let netLedger = 0

    if (user) {
      // a) Confirmed stakes received as Host from players joining hosted rounds
      const entriesReceived = await prisma.roundEntry.findMany({
        where: {
          stakeStatus: 'CONFIRMED',
          round: { hostId: user.id },
        },
        select: {
          round: { select: { stakeAmount: true } },
        },
      })
      const stakesReceived = entriesReceived.reduce(
        (sum, entry) => sum + Number(entry.round.stakeAmount),
        0
      )

      // b) Payouts received as winning player
      const payoutsReceivedList = await prisma.payout.findMany({
        where: {
          recipientId: user.id,
          status: { in: ['CONFIRMED', 'SENT'] },
        },
        select: { amount: true },
      })
      const payoutsReceived = payoutsReceivedList.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      )

      // c) Stakes paid as player joining rounds
      const entriesPaid = await prisma.roundEntry.findMany({
        where: {
          playerId: user.id,
          stakeStatus: 'CONFIRMED',
        },
        select: {
          round: { select: { stakeAmount: true } },
        },
      })
      const stakesPaid = entriesPaid.reduce(
        (sum, entry) => sum + Number(entry.round.stakeAmount),
        0
      )

      // d) Payouts sent by user as Host to winners
      const payoutsSentList = await prisma.payout.findMany({
        where: {
          round: { hostId: user.id },
          status: { in: ['CONFIRMED', 'SENT'] },
        },
        select: { amount: true },
      })
      const payoutsSent = payoutsSentList.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      )

      netLedger = (stakesReceived + payoutsReceived) - (stakesPaid + payoutsSent)
    }

    // Base starting balance is 50 NIM (or on-chain RPC balance if > 0)
    const baseBalance = onChainBalance !== null && onChainBalance > 0 ? onChainBalance : 50
    const finalBalance = Math.max(0, baseBalance + netLedger)

    return NextResponse.json({
      balance: finalBalance,
      baseBalance,
      netLedger,
      onChainBalance,
    })
  } catch (error) {
    console.error('Fetch balance error:', error)
    return NextResponse.json({ balance: 50 })
  }
}
