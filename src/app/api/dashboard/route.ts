import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'

const dashboardQuerySchema = z.object({
  language: z.string().min(1),
})

interface QuizMasteryLevel {
  level: string
  score: number
  color: string
}

interface DashboardResponse {
  speakStreak: number
  speakCountToday: number
  speakCountTotal: number
  quizMastery: QuizMasteryLevel[]
}

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user: supabaseUser } = authResult
    const { searchParams } = new URL(request.url)
    const { language } = dashboardQuerySchema.parse({
      language: searchParams.get('language'),
    })

    // Prismaからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 今日の日付（JST）
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. Speak Streak (連続話した日数)
    const speakStreak = user.consecutiveSpeakingDays

    // 2. Speak Count (Today) - 今日のスピーク回数
    const speakCountToday = await prisma.speakLog.aggregate({
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
    })

    // 3. Speak Count (Total) - 総スピーク回数
    const speakCountTotal = await prisma.speakLog.aggregate({
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
    })

    // 4. Quiz Mastery - クイズマスタリー
    // ユーザーのフレーズを取得し、各レベルの正解数を集計
    const phrases = await prisma.phrase.findMany({
      where: {
        userId: user.id,
        language: {
          code: language,
        },
        deletedAt: null,
      },
      include: {
        phraseLevel: true,
        quizResults: {
          where: {
            correct: true,
            deletedAt: null,
          },
        },
      },
    })

    // レベル別の正解数を集計
    const levelCorrectCounts = new Map<string, number>()
    
    for (const phrase of phrases) {
      const levelName = phrase.phraseLevel.name
      const correctCount = phrase.quizResults.length
      
      if (levelCorrectCounts.has(levelName)) {
        levelCorrectCounts.set(levelName, levelCorrectCounts.get(levelName)! + correctCount)
      } else {
        levelCorrectCounts.set(levelName, correctCount)
      }
    }

    // 全てのフレーズレベルを取得
    const allPhraseLevels = await prisma.phraseLevel.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        score: 'asc',
      },
    })

    // クイズマスタリーデータを構築
    const quizMastery: QuizMasteryLevel[] = allPhraseLevels.map((level) => ({
      level: level.name,
      score: levelCorrectCounts.get(level.name) || 0,
      color: level.color || '#6B7280', // デフォルトのグレー色
    }))

    const result: DashboardResponse = {
      speakStreak,
      speakCountToday: speakCountToday._sum.count || 0,
      speakCountTotal: speakCountTotal._sum.count || 0,
      quizMastery,
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
