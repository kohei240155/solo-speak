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

    // Prismaを使用してQuiz Resultsデータを取得
    const quizResults = await prisma.quizResult.findMany({
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

    console.log('Prisma query result:', { count: quizResults.length })
    console.log('First few quiz results:', quizResults.slice(0, 3))

    // デバッグ: 全期間のデータも確認
    const allQuizResults = await prisma.quizResult.count()
    console.log('Total quiz results in database:', allQuizResults)

    // デバッグ: 指定言語のフレーズ数も確認
    const phrasesForLanguage = await prisma.phrase.count({
      where: {
        languageId: languageId
      }
    })
    console.log('Phrases for language', language, ':', phrasesForLanguage)

    // ユーザー別に回数を集計（QuizResultはcorrect/incorrectの回数なので、総回答数をカウント）
    const userCountMap = new Map<string, { 
      user: { id: string, username: string, iconUrl: string | null, createdAt: Date }, 
      totalCount: number 
    }>()
    
    quizResults.forEach((result) => {
      const userId = result.phrase.user.id
      const currentData = userCountMap.get(userId)
      
      if (currentData) {
        currentData.totalCount += 1 // クイズ結果1件につき1回とカウント
      } else {
        userCountMap.set(userId, {
          user: result.phrase.user,
          totalCount: 1
        })
      }
    })

    console.log('User count map size:', userCountMap.size)

    // ランキングデータを作成
    const rankingData = Array.from(userCountMap.entries()).map(([userId, data]) => ({
      userId,
      username: data.user.username,
      iconUrl: data.user.iconUrl,
      count: data.totalCount,
      createdAt: data.user.createdAt
    }))

    // カウント順でソート（同数の場合は登録日時が古い方が上位）
    rankingData.sort((a, b) => {
      if (b.count === a.count) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return b.count - a.count
    })

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
    
    // 詳細なエラー情報をログに出力
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
