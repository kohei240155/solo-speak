import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { createCustomerPortalSession } from '@/utils/stripe-helpers'

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

    // カスタマーポータルセッションを作成
    const portalUrl = await createCustomerPortalSession(
      user.stripeCustomerId,
      `${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=subscription`
    )

    return NextResponse.json({ portalUrl })

  } catch (error) {
    console.error('Error creating customer portal session:', error)
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    )
  }
}
