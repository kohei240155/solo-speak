import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { getUserSubscriptionStatus } from '@/utils/stripe-helpers'

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
      
      return NextResponse.json({
        hasStripeCustomer: true,
        subscription: subscriptionInfo
      })
    }

    return NextResponse.json({
      hasStripeCustomer: false,
      subscription: { isActive: false }
    })

  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
