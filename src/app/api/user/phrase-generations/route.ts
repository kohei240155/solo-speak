import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { getUserSubscriptionStatus } from '@/utils/stripe-helpers'

/**
 * ユーザーのフレーズ生成回数を取得し、日付リセットを実行
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        remainingPhraseGenerations: true,
        lastPhraseGenerationDate: true,
        stripeCustomerId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let remainingGenerations = user.remainingPhraseGenerations
    const lastGenerationDate = user.lastPhraseGenerationDate

    // サブスクリプション状態を確認
    let hasActiveSubscription = false
    if (user.stripeCustomerId) {
      const subscriptionInfo = await getUserSubscriptionStatus(user.stripeCustomerId)
      hasActiveSubscription = subscriptionInfo.isActive
    }

    // サブスクリプションが有効で、現在の生成回数が0の場合は即座にリセット
    if (hasActiveSubscription && remainingGenerations === 0) {
      remainingGenerations = 5
      await prisma.user.update({
        where: { id: userId },
        data: {
          remainingPhraseGenerations: 5,
          lastPhraseGenerationDate: new Date()
        }
      })
    }

    // 日付リセットロジック（UTC基準）
    const now = new Date()
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

    // lastPhraseGenerationDateが存在しない、または今日より前の場合のみリセット
    if (!lastGenerationDate) {
      // 初回の場合は5回に設定
      remainingGenerations = 5
      
      // データベースを更新
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
        // サブスクリプションが有効な場合のみリセット、無効な場合は0のまま
        if (hasActiveSubscription) {
          remainingGenerations = 5
          
          // データベースを更新
          await prisma.user.update({
            where: { id: userId },
            data: {
              remainingPhraseGenerations: 5,
              lastPhraseGenerationDate: new Date()
            }
          })
        } else {
          // サブスクリプションが無効な場合は0に設定
          remainingGenerations = 0
          
          await prisma.user.update({
            where: { id: userId },
            data: {
              remainingPhraseGenerations: 0,
              lastPhraseGenerationDate: new Date()
            }
          })
        }
      }
      // 今日の場合は現在の値をそのまま使用（更新しない）
    }

    return NextResponse.json({
      remainingGenerations,
      lastGenerationDate: lastGenerationDate || null,
      hasActiveSubscription
    })

  } catch (error) {
    return createErrorResponse(error, 'GET /api/user/phrase-generations')
  }
}

/**
 * フレーズ生成時に回数を減らす
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        remainingPhraseGenerations: true,
        lastPhraseGenerationDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 残り回数をチェック
    if (user.remainingPhraseGenerations <= 0) {
      return NextResponse.json({ error: 'No remaining generations' }, { status: 403 })
    }

    // 回数を1減らして更新
    const newRemainingGenerations = user.remainingPhraseGenerations - 1
    await prisma.user.update({
      where: { id: userId },
      data: {
        remainingPhraseGenerations: newRemainingGenerations,
        lastPhraseGenerationDate: new Date()
      }
    })

    return NextResponse.json({
      remainingGenerations: newRemainingGenerations
    })

  } catch (error) {
    return createErrorResponse(error, 'POST /api/user/phrase-generations')
  }
}
