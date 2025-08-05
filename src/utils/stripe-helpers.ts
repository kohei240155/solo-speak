import Stripe from 'stripe'

// Stripe秘密鍵の確認
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables')
  throw new Error('Stripe configuration is missing')
}

if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('Invalid STRIPE_SECRET_KEY format')
  throw new Error('Invalid Stripe secret key format')
}

console.log('Stripe configuration loaded:', {
  hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
  hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  hasProductId: !!process.env.STRIPE_PRODUCT_ID,
  hasPriceId: !!process.env.STRIPE_BASIC_PLAN_PRICE_ID,
})

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
})

export interface SubscriptionInfo {
  isActive: boolean
  status?: string
  currentPeriodEnd?: Date
  productId?: string
  subscriptionId?: string
}

/**
 * ユーザーのサブスクリプション状態を取得
 */
export async function getUserSubscriptionStatus(stripeCustomerId: string): Promise<SubscriptionInfo> {
  try {
    // アクティブなサブスクリプションを取得
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    })

    if (activeSubscriptions.data.length === 0) {
      return { isActive: false }
    }

    const subscription = activeSubscriptions.data[0]
    
    // より詳細な情報を取得するため、個別にサブスクリプションを取得
    const detailedSubscription = await stripe.subscriptions.retrieve(subscription.id)
    
    // キャンセル予定のサブスクリプションもチェック
    const isCanceled = detailedSubscription.cancel_at_period_end || detailedSubscription.canceled_at
    
    const productId = detailedSubscription.items.data[0]?.price.product as string

    // Stripe APIからの生データをログに出力  
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = detailedSubscription as any // Stripe型の制限を回避

    // Stripeから直接current_period_endを取得（これが次回請求日）
    let currentPeriodEnd: Date | undefined = undefined
    
    if (subscriptionData.current_period_end && subscriptionData.current_period_end > 0) {
      currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000)
    } else if (subscriptionData.billing_cycle_anchor && subscriptionData.billing_cycle_anchor > 0) {
      // billing_cycle_anchorから次回請求日を計算（月次サブスクリプションの場合）
      const anchorDate = new Date(subscriptionData.billing_cycle_anchor * 1000)
      const nextBillingDate = new Date(anchorDate)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
      currentPeriodEnd = nextBillingDate
    }

    return {
      isActive: !isCanceled, // キャンセル予定の場合は非アクティブとして扱う
      status: detailedSubscription.status,
      currentPeriodEnd,
      productId,
      subscriptionId: detailedSubscription.id,
    }
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return { isActive: false }
  }
}

/**
 * Stripe顧客を作成
 */
export async function createStripeCustomer(email: string, userId: string): Promise<string> {
  try {
    console.log('Creating Stripe customer for:', { email, userId })
    
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    })
    
    console.log('Stripe customer created successfully:', customer.id)
    return customer.id
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`)
    }
    throw new Error('Failed to create Stripe customer')
  }
}

/**
 * サブスクリプション用のチェックアウトセッションを作成
 */
export async function createCheckoutSession(
  stripeCustomerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    })
    
    return session.url || ''
  } catch (error) {
    console.error('Error creating checkout session:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to create checkout session: ${error.message}`)
    }
    throw new Error('Failed to create checkout session')
  }
}

/**
 * サブスクリプションをキャンセル（即座に無効化）
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  try {
    // 即座にキャンセルする（期間終了を待たない）
    await stripe.subscriptions.cancel(subscriptionId)
  } catch (error) {
    console.error('Error canceling subscription:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`)
    }
    throw new Error('Failed to cancel subscription')
  }
}

/**
 * カスタマーポータルセッションを作成（サブスクリプション管理用）
 */
export async function createCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    })

    return session.url
  } catch (error) {
    console.error('Error creating customer portal session:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to create customer portal session: ${error.message}`)
    }
    throw new Error('Failed to create customer portal session')
  }
}export { stripe }
