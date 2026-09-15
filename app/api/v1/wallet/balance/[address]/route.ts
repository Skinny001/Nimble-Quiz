import { NextRequest, NextResponse } from 'next/server'
import { rpcBase } from '@/lib/chain'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    
    // Attempt 1: Fetch as a REST endpoint (assuming it's an indexer like NimiqScan)
    let response = await fetch(`${rpcBase()}/address/${address}`)
    if (response.ok) {
      const data = await response.json()
      const balanceLuna = data.balance ?? (data.data && data.data.balance)
      if (balanceLuna !== undefined) {
        return NextResponse.json({ balance: balanceLuna / 100000 })
      }
    }
    
    // Attempt 2: Fetch using standard Nimiq JSON-RPC
    response = await fetch(rpcBase(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'getAccountByAddress',
        params: [address],
        id: 1
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.result && data.result.data) {
        return NextResponse.json({ balance: data.result.data.balance / 100000 })
      }
    }
    
    return NextResponse.json({ balance: 0 })
  } catch (error) {
    console.error('Fetch balance error:', error)
    return NextResponse.json({ balance: 0 })
  }
}
