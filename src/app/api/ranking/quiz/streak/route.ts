import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { DEFAULT_LANGUAGE } from '@/constants/languages'
import { calculateStreak, formatDatesToStrings } from '@/utils/streak-calculator'

/** QuizStreak ランキングAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns Streakランキングデータ
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || DEFAULT_LANGUAGE

    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const user = authResult.user

    // 言語コードから言語IDを取得
    const languageRecord = await prisma.language.findFirst({
      where: {
        code: language,
        deletedAt: null
      }
    })

    if (!languageRecord) {
      return NextResponse.json({
        success: false,
        error: 'Language not found'
      }, { status: 400 })
    }

    // 各ユーザーのQuiz記録からStreak計算
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        phrases: {
          some: {
            languageId: languageRecord.id,
            deletedAt: null,
            quizResults: {
              some: {}
            }
          }
        }
      },
      select: {
        id: true,
        username: true,
        iconUrl: true,
        createdAt: true,
        phrases: {
          where: {
            languageId: languageRecord.id,
            deletedAt: null
          },
          select: {
            quizResults: {
              where: {
                deletedAt: null
              },
              select: {
                date: true
              },
              orderBy: {
                date: 'asc'
              }
            }
          }
        }
      }
    })

    // 各ユーザーのStreak を計算
    const streakData = users.map(userData => {
      // 全ての quiz 結果の日付を集める
      const allQuizDates = userData.phrases.flatMap(phrase =>
        phrase.quizResults.map(result => result.date)
      )

      const dateStrings = formatDatesToStrings(allQuizDates)
      const streakDays = calculateStreak(dateStrings)

      return {
        userId: userData.id,
        username: userData.username || 'Unknown User',
        iconUrl: userData.iconUrl,
        streakDays,
        createdAt: userData.createdAt
      }
    })

    // Streak日数順でソート（同数の場合は登録日時が古い方が上位）
    // Streakが0の場合は除外
    const validStreakData = streakData.filter(data => data.streakDays > 0)
    
    validStreakData.sort((a, b) => {
      if (b.streakDays === a.streakDays) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return b.streakDays - a.streakDays
    })

    // ランクを付与（上位10位まで）
    const topUsers = validStreakData
      .slice(0, 10)
      .map((userData, index) => ({
        rank: index + 1,
        userId: userData.userId,
        username: userData.username,
        iconUrl: userData.iconUrl,
        streakDays: userData.streakDays
      }))

    // 現在のユーザーの情報を取得（10位圏外でも取得）
    let currentUser = topUsers.find(u => u.userId === user.id) || null
    
    // 10位圏外の場合、全データから該当ユーザーの順位を取得
    if (!currentUser) {
      const userIndex = validStreakData.findIndex(u => u.userId === user.id)
      if (userIndex !== -1) {
        const userData = validStreakData[userIndex]
        currentUser = {
          rank: userIndex + 1,
          userId: userData.userId,
          username: userData.username,
          iconUrl: userData.iconUrl,
          streakDays: userData.streakDays
        }
      }
    }

    return NextResponse.json({
      success: true,
      topUsers,
      currentUser
    })

  } catch (error) {
    console.error('Quiz streak ranking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
}
