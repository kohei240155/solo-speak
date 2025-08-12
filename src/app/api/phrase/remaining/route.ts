import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { RemainingGenerationsResponse } from '@/types/phrase'

/** * ユーザーの残りのフレーズ生成回数を取得
 * @param request - Next.jsのリクエストオブジェクト
 * @returns RemainingGenerationsResponse - 残りのフレーズ生成回数
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        remainingPhraseGenerations: true,
        lastPhraseGenerationDate: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    let remainingGenerations = user.remainingPhraseGenerations
    const lastGenerationDate = user.lastPhraseGenerationDate

    // 日付リセットロジック（UTC基準）
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    if (!lastGenerationDate) {
      // 初回の場合は5回に設定
      remainingGenerations = 5
      await prisma.user.update({
        where: { id: userId },
        data: {
          remainingPhraseGenerations: 5,
          lastPhraseGenerationDate: new Date()
        }
      })
    } else {
      const lastGenerationDateUTC = new Date(lastGenerationDate)
      const lastGenerationDayUTC = new Date(Date.UTC(
        lastGenerationDateUTC.getUTCFullYear(), 
        lastGenerationDateUTC.getUTCMonth(), 
        lastGenerationDateUTC.getUTCDate()
      ))
      
      // 最後の生成日が今日より前の場合のリセット処理（UTC基準）
      if (lastGenerationDayUTC.getTime() < todayUTC.getTime()) {
        remainingGenerations = 5
        await prisma.user.update({
          where: { id: userId },
          data: {
            remainingPhraseGenerations: 5,
            lastPhraseGenerationDate: new Date()
          }
        })
      }
    }

    const result: RemainingGenerationsResponse = {
      remainingGenerations
    }

    return NextResponse.json(result)

  } catch (error) {
    return createErrorResponse(error, 'GET /api/phrase/remaining')
  }
}
