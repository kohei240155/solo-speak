import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { getUserSubscriptionStatus } from '@/utils/stripe-helpers'

/** * ユーザーのサブスクリプション情報を取得するAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns { isActive: boolean, subscriptionId?: string } - サブスクリプションの状態とID
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
        stripeCustomerId: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // サブスクリプション状態を取得
    if (user.stripeCustomerId) {
      const subscriptionInfo = await getUserSubscriptionStatus(user.stripeCustomerId)
      
      // データベースの現在時刻とタイムゾーンを取得
      const dbTimeResult = await prisma.$queryRaw<{ now: Date; timezone: string }[]>`
        SELECT NOW() as now, current_setting('TIMEZONE') as timezone
      `
      const dbInfo = dbTimeResult[0]
      
      const responseData = {
        hasStripeCustomer: true,
        subscription: {
          ...subscriptionInfo,
          // DateをISO文字列に変換してフロントエンドに送信
          currentPeriodEnd: subscriptionInfo.currentPeriodEnd?.toISOString()
        },
        serverTime: dbInfo.now,
        serverTimezone: dbInfo.timezone
      }
      
      return NextResponse.json(responseData)
    }

    return NextResponse.json({
      hasStripeCustomer: false,
      subscription: { isActive: false },
      serverTime: new Date(),
      serverTimezone: 'UTC'
    })

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
