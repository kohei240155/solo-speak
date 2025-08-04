import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { getUserSubscriptionStatus, cancelSubscription } from '@/utils/stripe-helpers'

export async function POST(request: NextRequest) {
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

    if (!user || !user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      )
    }

    // サブスクリプション情報を取得
    const subscriptionInfo = await getUserSubscriptionStatus(user.stripeCustomerId)
    
    if (!subscriptionInfo.isActive || !subscriptionInfo.subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // サブスクリプションをキャンセル
    await cancelSubscription(subscriptionInfo.subscriptionId)

    return NextResponse.json({ success: true, message: 'Subscription will be canceled at the end of the current period' })

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
