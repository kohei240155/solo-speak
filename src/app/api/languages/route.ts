import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(languages)
  } catch (error) {
    console.error('Error fetching languages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
