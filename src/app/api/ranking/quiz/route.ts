import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    console.log('Quiz ranking API called')
    
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

    // Prismaを使用してQuiz Logsデータを取得
    const quizLogs = await prisma.quizLog.findMany({
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

    console.log('Prisma query result:', { count: quizLogs.length })
    console.log('First few quiz logs:', quizLogs.slice(0, 3))

    // デバッグ: 全期間のデータも確認
    const allQuizLogs = await prisma.quizLog.count()
    console.log('Total quiz logs in database:', allQuizLogs)

    // デバッグ: 指定言語のフレーズ数も確認
    const phrasesForLanguage = await prisma.phrase.count({
      where: {
        languageId: languageId
      }
    })
    console.log('Phrases for language', language, ':', phrasesForLanguage)

    // ユーザー別に回数を集計
    const userCountMap = new Map<string, { 
      user: { id: string, username: string, iconUrl: string | null }, 
      totalCount: number 
    }>()
    
    quizLogs.forEach((log: any) => {
      const userId = log.phrase.user.id
      const currentData = userCountMap.get(userId)
      
      if (currentData) {
        currentData.totalCount += log.count
      } else {
        userCountMap.set(userId, {
          user: log.phrase.user,
          totalCount: log.count
        })
      }
    })

    console.log('User count map size:', userCountMap.size)

    // ランキングデータを作成
    const rankingData = Array.from(userCountMap.entries()).map(([userId, data]) => ({
      userId,
      username: data.user.username,
      iconUrl: data.user.iconUrl,
      count: data.totalCount
    }))

    // カウント順でソート
    rankingData.sort((a, b) => b.count - a.count)

    // ランクを付与
    const topUsers = rankingData.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      username: user.username,
      iconUrl: user.iconUrl,
      count: user.count
    }))

    console.log('Top users:', topUsers)

    // 現在のユーザーの情報を取得
    const currentUser = topUsers.find(u => u.userId === user.id) || null

    console.log('Current user ranking:', currentUser)

    return NextResponse.json({
      success: true,
      topUsers,
      currentUser
    })

  } catch (error) {
    console.error('Quiz ranking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
