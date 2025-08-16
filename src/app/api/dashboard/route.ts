import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { ApiErrorResponse } from '@/types/api'
import { DashboardData, QuizMasteryLevel } from '@/types/dashboard'
import { prisma } from '@/utils/prisma'

/**
 * ダッシュボードデータ取得APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns DashboardData - ダッシュボードに表示するデータ
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')

    if (!language) {
      const errorResponse: ApiErrorResponse = {
        error: 'Language parameter is required'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const user = authResult.user

    // 今日の日付範囲を計算（UTC基準）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Promise.allを使用して並列処理でパフォーマンスを向上
    const [
      totalPhraseCount,
      speakCountToday,
      speakCountTotal,
      allPhrases,
      allPhraseLevels
    ] = await Promise.all([
      // 1. Total Phrase Count - 指定言語のフレーズ総数
      prisma.phrase.count({
        where: {
          userId: user.id,
          language: {
            code: language,
          },
          deletedAt: null,
        },
      }),

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

      // 4. All Phrases by Level - レベル別フレーズ数を取得するために全フレーズを取得
      prisma.phrase.findMany({
        where: {
          userId: user.id,
          language: {
            code: language,
          },
          deletedAt: null,
        },
        include: {
          phraseLevel: true,
        },
      }),

      // 5. All Phrase Levels - 全フレーズレベル
      prisma.phraseLevel.findMany({
        where: { deletedAt: null },
        orderBy: { score: 'asc' },
      }),
    ])

    // Quiz Masteryデータの集計 - レベル別フレーズ総数
    const quizMastery: QuizMasteryLevel[] = allPhraseLevels.map((level) => ({
      level: level.name,
      score: allPhrases.filter(
        (phrase) => phrase.phraseLevel?.id === level.id
      ).length,
      color: level.color || '#gray-500',
    }))

    const responseData: DashboardData = {
      totalPhraseCount,
      speakCountToday: speakCountToday._sum.count || 0,
      speakCountTotal: speakCountTotal._sum.count || 0,
      quizMastery
    }

    return NextResponse.json(responseData)

  } catch {
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
