import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  try {
    const token = authHeader.slice(7)
    const { userId } = JSON.parse(Buffer.from(token, 'base64').toString())
    const user = await prisma.user.findUnique({ where: { id: userId } })
    return user
  } catch {
    return null
  }
}

export async function requireAuth(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) throw new Error('Unauthorized')
  return user
}