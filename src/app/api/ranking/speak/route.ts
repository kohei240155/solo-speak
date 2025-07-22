import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    console.log('Speak ranking API called')
    
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    const period = searchParams.get('period') || 'daily'
    
    console.log('Parameters:', { language, period })

    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const user = authResult.user
    console.log('User authenticated:', user.id)

    // 言語コードから言語IDを取得
    const languageRecord = await prisma.language.findFirst({
      where: {
        code: language
      }
    })

    if (!languageRecord) {
      console.log('Language not found:', language)
      return NextResponse.json({
        success: false,
        error: 'Language not found'
      }, { status: 400 })
    }

    const languageId = languageRecord.id
    console.log('Language mapping:', { code: language, id: languageId })

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
                iconUrl: true
              }
            }
          }
        }
      }
    })

    console.log('Prisma query result:', { count: speakLogs.length })
    console.log('First few speak logs:', speakLogs.slice(0, 3))

    // デバッグ: 全期間のデータも確認
    const allSpeakLogs = await prisma.speakLog.count()
    console.log('Total speak logs in database:', allSpeakLogs)

    // デバッグ: 指定言語のフレーズ数も確認
    const phrasesForLanguage = await prisma.phrase.count({
      where: {
        languageId: languageId
      }
    })
    console.log('Phrases for language', language, ':', phrasesForLanguage)

    // デバッグ: すべての言語を確認
    const allLanguages = await prisma.language.findMany({
      select: {
        id: true,
        code: true,
        name: true
      }
    })
    console.log('Available languages:', allLanguages)

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
    const userCounts = new Map<string, { userId: string, username: string, iconUrl: string | null, count: number }>()

    speakLogs.forEach((log) => {
      const userId = log.phrase.user.id
      const username = log.phrase.user.username
      const iconUrl = log.phrase.user.iconUrl
      const speakCount = log.count || 1

      if (userCounts.has(userId)) {
        userCounts.get(userId)!.count += speakCount
      } else {
        userCounts.set(userId, {
          userId,
          username,
          iconUrl,
          count: speakCount
        })
      }
    })

    // ランキング順にソート
    const rankedUsers = Array.from(userCounts.values())
      .sort((a, b) => b.count - a.count)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl,
        count: user.count
      }))

    // 現在のユーザーの順位を取得
    const currentUserRank = rankedUsers.find(u => u.userId === user.id)

    return NextResponse.json({
      success: true,
      topUsers: rankedUsers,
      currentUser: currentUserRank || null
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
