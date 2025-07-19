import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@/generated/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

const prisma = new PrismaClient()

const createPhraseSchema = z.object({
  userId: z.string().min(1),
  languageId: z.string().min(1),
  text: z.string().min(1).max(200),
  translation: z.string().min(1).max(200),
  level: z.enum(['common', 'polite', 'casual']).optional(),
  phraseLevelId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { userId, languageId, text, translation, level, phraseLevelId } = createPhraseSchema.parse(body)

    // 認証されたユーザーIDとリクエストのuserIdが一致するかチェック
    if (authResult.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot create phrase for another user' },
        { status: 403 }
      )
    }

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

    // フレーズレベルIDを決定
    let finalPhraseLevelId = phraseLevelId
    
    if (!finalPhraseLevelId && level) {
      // levelが指定されている場合、対応するphraseLevelIdを取得
      const phraseLevel = await prisma.phraseLevel.findFirst({
        where: { name: level }
      })
      
      if (phraseLevel) {
        finalPhraseLevelId = phraseLevel.id
      }
    }
    
    // それでもphraseLevelIdが決まらない場合、デフォルトのフレーズレベルを取得
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
        language: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        phraseLevel: true,
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    })

    // フロントエンドの期待する形式に変換
    const transformedPhrase = {
      id: phrase.id,
      text: phrase.text,
      translation: phrase.translation,
      createdAt: phrase.createdAt,
      practiceCount: phrase.totalReadCount,
      correctAnswers: phrase.correctQuizCount,
      language: {
        name: phrase.language.name,
        code: phrase.language.code
      }
    }

    return NextResponse.json({
      success: true,
      phrase: transformedPhrase
    }, { status: 201 })

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
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const languageId = searchParams.get('languageId')
    const languageCode = searchParams.get('languageCode')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const minimal = searchParams.get('minimal') === 'true' // 最小限のデータのみ取得するフラグ
    const offset = (page - 1) * limit

    // 認証されたユーザーIDとリクエストのuserIdが一致するかチェック（userIdが指定されている場合）
    if (userId && authResult.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot access another user\'s phrases' },
        { status: 403 }
      )
    }

    const where: {
      userId?: string
      languageId?: string
    } = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (languageId) {
      where.languageId = languageId
    } else if (languageCode) {
      // languageCodeが指定されている場合、対応するlanguageIdを取得
      const language = await prisma.language.findUnique({
        where: { code: languageCode }
      })
      if (language) {
        where.languageId = language.id
      }
    }

    const phrases = await prisma.phrase.findMany({
      where,
      include: minimal ? {
        // 最小限のデータのみ
        language: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      } : {
        // 完全なデータ
        language: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
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

    // フロントエンドの期待する形式に変換
    const transformedPhrases = phrases.map(phrase => ({
      id: phrase.id,
      text: phrase.text,
      translation: phrase.translation,
      createdAt: phrase.createdAt,
      practiceCount: phrase.totalReadCount,
      correctAnswers: phrase.correctQuizCount,
      language: {
        name: phrase.language.name,
        code: phrase.language.code
      }
    }))

    return NextResponse.json({
      success: true,
      phrases: transformedPhrases,
      pagination: {
        total,
        limit,
        page,
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
