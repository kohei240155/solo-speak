import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { RankingQueryParams, SpeakRankingResponseData } from '@/types/ranking-api'
import { ApiErrorResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    console.log('Speak ranking API called')
    
    const { searchParams } = new URL(request.url)
    const queryParams: RankingQueryParams = {
      language: searchParams.get('language') || 'en',
      period: (searchParams.get('period') as 'daily' | 'weekly' | 'monthly') || 'daily'
    }
    const { language, period } = queryParams
    
    console.log('Parameters:', { language, period })

    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const user = authResult.user
    console.log('User authenticated:', user.id)

    // Promise.allを使用して並列処理でパフォーマンスを向上
    const [languageRecord, allSpeakLogs, allLanguages] = await Promise.all([
      // 言語コードから言語IDを取得
      prisma.language.findFirst({
        where: {
          code: language
        }
      }),
      
      // デバッグ: 全期間のデータも確認
      prisma.speakLog.count(),
      
      // デバッグ: すべての言語を確認
      prisma.language.findMany({
        select: {
          id: true,
          code: true,
          name: true
        }
      })
    ])

    if (!languageRecord) {
      console.log('Language not found:', language)
      const errorResponse: ApiErrorResponse = {
        error: 'Language not found'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const languageId = languageRecord.id
    console.log('Language mapping:', { code: language, id: languageId })
    console.log('Total speak logs in database:', allSpeakLogs)
    console.log('Available languages:', allLanguages)

    // 期間に応じた日付条件を設定
    const now = new Date()
    let startDate: Date
    
    if (period === 'daily') {
      startDate = new Date(now.toDateString())
    } else if (period === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else {
      // total の場合は全期間
      startDate = new Date('1970-01-01')
    }

    console.log('Date filter:', { period, startDate })

    // Prismaを使用してSpeak Logsデータを取得
    const speakLogs = await prisma.speakLog.findMany({
      where: {
        date: {
          gte: startDate
        },
        phrase: {
          languageId: languageId
        }
      },
      include: {
        phrase: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                iconUrl: true,
                createdAt: true // ユーザー登録日時を取得
              }
            }
          }
        }
      }
    })

    console.log('Prisma query result:', { count: speakLogs.length })
    console.log('First few speak logs:', speakLogs.slice(0, 3))

    // デバッグ: 指定言語のフレーズ数も確認
    const phrasesForLanguage = await prisma.phrase.count({
      where: {
        languageId: languageId
      }
    })
    console.log('Phrases for language', language, ':', phrasesForLanguage)

    // デバッグ: 期間を無視して該当言語のスピークログを取得
    const speakLogsNoDateFilter = await prisma.speakLog.findMany({
      where: {
        phrase: {
          languageId: languageId
        }
      },
      include: {
        phrase: {
          select: {
            languageId: true
          }
        }
      },
      take: 5
    })
    console.log('Speak logs without date filter (first 5):', speakLogsNoDateFilter)

    // ユーザーごとのSpeak回数を集計
    const userCounts = new Map<string, { 
      userId: string, 
      username: string, 
      iconUrl: string | null, 
      count: number,
      createdAt: Date
    }>()

    speakLogs.forEach((log) => {
      const userId = log.phrase.user.id
      const username = log.phrase.user.username
      const iconUrl = log.phrase.user.iconUrl
      const createdAt = log.phrase.user.createdAt
      const speakCount = log.count || 1

      if (userCounts.has(userId)) {
        userCounts.get(userId)!.count += speakCount
      } else {
        userCounts.set(userId, {
          userId,
          username,
          iconUrl,
          count: speakCount,
          createdAt
        })
      }
    })

    // ランキング順にソート（同数の場合は登録日時が古い方が上位）
    const rankedUsers = Array.from(userCounts.values())
      .sort((a, b) => {
        if (b.count === a.count) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        return b.count - a.count
      })
      .slice(0, 50) // 上位50位まで制限
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl,
        count: user.count
      }))

    // 現在のユーザーの順位を取得
    const currentUserRank = rankedUsers.find(u => u.userId === user.id)

    const responseData: SpeakRankingResponseData = {
      success: true,
      topUsers: rankedUsers,
      currentUser: currentUserRank || null
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('API error:', error)
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
