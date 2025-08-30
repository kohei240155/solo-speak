import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { DEFAULT_LANGUAGE } from '@/constants/languages'

/** フレーズStreak ランキングAPIエンドポイント
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

    // 各ユーザーのフレーズ作成日のStreak計算
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        phrases: {
          some: {
            languageId: languageRecord.id,
            deletedAt: null
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
            createdAt: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    // 各ユーザーのStreakを計算
    const streakData = users.map(userData => {
      const phraseDates = userData.phrases.map(phrase => {
        const date = new Date(phrase.createdAt)
        // UTC日付をそのまま使用
        return date.toISOString().split('T')[0]
      })

      // 重複を除去してソート
      const uniqueDates = [...new Set(phraseDates)].sort()

      if (uniqueDates.length === 0) {
        return {
          userId: userData.id,
          username: userData.username || 'Unknown User',
          iconUrl: userData.iconUrl,
          streakDays: 0,
          createdAt: userData.createdAt
        }
      }

      // 現在の連続日数を計算
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      
      let currentStreak = 0
      const checkDate = new Date(todayStr)

      // 今日から遡って連続日数を計算
      while (true) {
        const checkDateStr = checkDate.toISOString().split('T')[0]
        
        if (uniqueDates.includes(checkDateStr)) {
          currentStreak++
          // 前日をチェック
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          // 連続が途切れた場合
          break
        }
      }

      return {
        userId: userData.id,
        username: userData.username || 'Unknown User',
        iconUrl: userData.iconUrl,
        streakDays: currentStreak,
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
    console.error('Phrase streak ranking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
}
