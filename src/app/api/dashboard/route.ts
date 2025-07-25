import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { 
  DashboardData, 
  QuizMasteryLevel,
  DashboardQueryParams
} from '@/types/dashboard'
import { ApiErrorResponse } from '@/types/api'

const dashboardQuerySchema = z.object({
  language: z.string().min(1),
})

// 言語ごとの連続スピーキング日数を計算する関数
async function calculateConsecutiveSpeakingDays(userId: string, languageCode: string): Promise<number> {
  // 指定言語のフレーズを作成日降順で取得
  const phrases = await prisma.phrase.findMany({
    where: {
      userId,
      language: { code: languageCode },
      deletedAt: null,
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  if (phrases.length === 0) {
    return 0
  }

  // 日付を YYYY-MM-DD 形式の文字列に変換してユニーク化し、Setに変換
  const uniqueDatesSet = new Set(phrases.map(phrase => {
    const date = new Date(phrase.createdAt)
    return date.toISOString().split('T')[0]
  }))

  // 今日の日付を YYYY-MM-DD 形式で取得
  const today = new Date()
  let consecutiveDays = 0

  // 今日から過去に向かって連続日数をカウント
  for (let i = 0; i < 365; i++) { // 最大365日まで遡る
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const checkDateStr = checkDate.toISOString().split('T')[0]

    if (uniqueDatesSet.has(checkDateStr)) {
      consecutiveDays++
    } else {
      // 連続が途切れた場合は終了
      break
    }
  }

  return consecutiveDays
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user: supabaseUser } = authResult
    const { searchParams } = new URL(request.url)
    const queryParams: DashboardQueryParams = dashboardQuerySchema.parse({
      language: searchParams.get('language'),
    })
    const { language } = queryParams

    // Prismaからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        error: 'User not found'
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // 今日の日付（JST）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Promise.allを使用して並列処理でパフォーマンスを向上
    const [
      speakStreak,
      speakCountToday,
      speakCountTotal,
      quizResults,
      allPhraseLevels
    ] = await Promise.all([
      // 1. Speak Streak (連続話した日数) - 言語ごとに計算
      calculateConsecutiveSpeakingDays(user.id, language),

      // 2. Speak Count (Today) - 今日のスピーク回数
      prisma.speakLog.aggregate({
        _sum: {
          count: true,
        },
        where: {
          phrase: {
            userId: user.id,
            language: {
              code: language,
            },
          },
          date: {
            gte: today,
            lt: tomorrow,
          },
          deletedAt: null,
        },
      }),

      // 3. Speak Count (Total) - 総スピーク回数
      prisma.speakLog.aggregate({
        _sum: {
          count: true,
        },
        where: {
          phrase: {
            userId: user.id,
            language: {
              code: language,
            },
          },
          deletedAt: null,
        },
      }),

      // 4. Quiz Results - クイズ結果
      prisma.quizResult.findMany({
        where: {
          phrase: {
            userId: user.id,
            language: {
              code: language,
            },
          },
          correct: true,
          deletedAt: null,
        },
        include: {
          phrase: {
            include: {
              phraseLevel: true,
            },
          },
        },
      }),

      // 5. 全てのフレーズレベルを取得
      prisma.phraseLevel.findMany({
        where: {
          deletedAt: null,
        },
        orderBy: {
          score: 'asc',
        },
      })
    ])

    // レベル別の正解数を集計
    const levelCorrectCounts = new Map<string, number>()
    
    for (const result of quizResults) {
      const levelName = result.phrase.phraseLevel.name
      
      if (levelCorrectCounts.has(levelName)) {
        levelCorrectCounts.set(levelName, levelCorrectCounts.get(levelName)! + 1)
      } else {
        levelCorrectCounts.set(levelName, 1)
      }
    }

    // クイズマスタリーデータを構築
    const quizMastery: QuizMasteryLevel[] = allPhraseLevels.map((level) => ({
      level: level.name,
      score: levelCorrectCounts.get(level.name) || 0,
      color: level.color || '#6B7280', // デフォルトのグレー色
    }))

    const result: DashboardData = {
      speakStreak,
      speakCountToday: speakCountToday._sum.count || 0,
      speakCountTotal: speakCountTotal._sum.count || 0,
      quizMastery,
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    
    if (error instanceof z.ZodError) {
      const errorResponse: ApiErrorResponse = {
        error: 'Invalid request parameters',
        details: error.issues
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
