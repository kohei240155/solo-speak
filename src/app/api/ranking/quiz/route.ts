import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_LANGUAGE } from '@/constants/languages'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

/** ランキングAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns ランキングデータ
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || DEFAULT_LANGUAGE
    const period = searchParams.get('period') || 'daily'

    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const user = authResult.user

    // Promise.allを使用して並列処理でパフォーマンスを向上
    const [languageRecord] = await Promise.all([
      // 言語コードから言語IDを取得
      prisma.language.findFirst({
        where: {
          code: language,
          deletedAt: null // 削除されていない言語のみ
        }
      })
    ])

    if (!languageRecord) {
      return NextResponse.json({
        success: false,
        error: 'Language not found'
      }, { status: 400 })
    }

    const languageId = languageRecord.id

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

    // Prismaを使用してQuiz Resultsデータを取得（正解のみ）
    const quizResults = await prisma.quizResult.findMany({
      where: {
        date: {
          gte: startDate
        },
        correct: true, // 正解のみを取得
        deletedAt: null, // 削除されていないクイズ結果のみ
        phrase: {
          languageId: languageId,
          deletedAt: null // 削除されていないフレーズのみ
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

    // ユーザー別に正解数を集計
    const userCountMap = new Map<string, { 
      user: { id: string, username: string | null, iconUrl: string | null, createdAt: Date }, 
      totalCount: number 
    }>()
    
    quizResults.forEach((result) => {
      const userId = result.phrase.user.id
      const currentData = userCountMap.get(userId)
      
      if (currentData) {
        currentData.totalCount += 1 // 正解数をカウント
      } else {
        userCountMap.set(userId, {
          user: result.phrase.user,
          totalCount: 1
        })
      }
    })

    // ランキングデータを作成
    const rankingData = Array.from(userCountMap.entries()).map(([userId, data]) => ({
      userId,
      username: data.user.username || 'Anonymous',
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

    // ランクを付与（上位10位まで）
    const topUsers = rankingData
      .slice(0, 10) // 上位10位まで制限
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl,
        count: user.count
      }))

    // 現在のユーザーの情報を取得（10位圏外でも取得）
    let currentUser = topUsers.find(u => u.userId === user.id) || null
    
    // 10位圏外の場合、全データから該当ユーザーの順位を取得
    if (!currentUser) {
      const userIndex = rankingData.findIndex(u => u.userId === user.id)
      if (userIndex !== -1) {
        const userData = rankingData[userIndex]
        currentUser = {
          rank: userIndex + 1,
          userId: userData.userId,
          username: userData.username,
          iconUrl: userData.iconUrl,
          count: userData.count
        }
      }
    }

    return NextResponse.json({
      success: true,
      topUsers,
      currentUser
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
