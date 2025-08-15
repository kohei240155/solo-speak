import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { ApiErrorResponse } from '@/types/api'
import { UserDailyResetResponse } from '@/types/user'

/** * ユーザーの1日ごとの音読練習回数をリセットするAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns UserDailyResetResponse - リセット結果とメッセージ
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        lastDailySpeakCountResetDate: true
      }
    })

    if (!user) {
      const errorResponse: ApiErrorResponse = {
        error: 'User not found'
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // UTC基準での日付比較
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    let shouldReset = false
    let resetCount = 0

    // lastDailySpeakCountResetDateが存在しない、または今日より前の場合のみリセット
    if (!user.lastDailySpeakCountResetDate) {
      // 初回の場合は必ずリセット
      shouldReset = true
    } else {
      const lastResetDateUTC = new Date(user.lastDailySpeakCountResetDate)
      const lastResetDayUTC = new Date(Date.UTC(
        lastResetDateUTC.getUTCFullYear(), 
        lastResetDateUTC.getUTCMonth(), 
        lastResetDateUTC.getUTCDate()
      ))
      
      // 最後のリセット日が今日より前の場合のみリセット（UTC基準）
      if (lastResetDayUTC.getTime() < todayUTC.getTime()) {
        shouldReset = true
      }
    }

    if (shouldReset) {
      // ユーザーに紐づく全てのフレーズのdailySpeakCountを0にリセット
      const updateResult = await prisma.phrase.updateMany({
        where: {
          userId: userId,
          deletedAt: null
        },
        data: {
          dailySpeakCount: 0
        }
      })

      resetCount = updateResult.count

      // ユーザーのlastDailySpeakCountResetDateを現在時刻に更新
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastDailySpeakCountResetDate: new Date()
        }
      })
    }

    const responseData: UserDailyResetResponse = {
      success: true,
      reset: shouldReset,
      message: shouldReset 
        ? `Reset dailySpeakCount for ${resetCount} phrases` 
        : 'No reset needed - already practiced today',
      count: resetCount,
      lastDailySpeakCountResetDate: user.lastDailySpeakCountResetDate
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error resetting daily speak count:', error)
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
