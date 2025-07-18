import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

const createPhraseSchema = z.object({
  userId: z.string().min(1),
  languageId: z.string().min(1),
  text: z.string().min(1).max(200),
  translation: z.string().min(1).max(200),
  phraseLevelId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, languageId, text, translation, phraseLevelId } = createPhraseSchema.parse(body)

    // ユーザーが存在するかチェック
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 言語が存在するかチェック
    const language = await prisma.language.findUnique({
      where: { id: languageId }
    })

    if (!language) {
      return NextResponse.json(
        { error: 'Language not found' },
        { status: 404 }
      )
    }

    // デフォルトのフレーズレベルを取得（指定されていない場合）
    let finalPhraseLevelId = phraseLevelId
    if (!finalPhraseLevelId) {
      const defaultLevel = await prisma.phraseLevel.findFirst({
        orderBy: { score: 'asc' }
      })
      
      if (!defaultLevel) {
        return NextResponse.json(
          { error: 'No phrase level found' },
          { status: 500 }
        )
      }
      
      finalPhraseLevelId = defaultLevel.id
    }

    // フレーズを作成
    const phrase = await prisma.phrase.create({
      data: {
        userId,
        languageId,
        text,
        translation,
        phraseLevelId: finalPhraseLevelId,
      },
      include: {
        language: true,
        phraseLevel: true,
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    })

    return NextResponse.json(phrase, { status: 201 })

  } catch (error) {
    console.error('Error creating phrase:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const languageId = searchParams.get('languageId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: {
      userId?: string
      languageId?: string
    } = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (languageId) {
      where.languageId = languageId
    }

    const phrases = await prisma.phrase.findMany({
      where,
      include: {
        language: true,
        phraseLevel: true,
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.phrase.count({ where })

    return NextResponse.json({
      phrases,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching phrases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
