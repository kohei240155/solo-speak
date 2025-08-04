import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/utils/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log('Stripe webhook event received:', event.type)

    // サブスクリプション関連のイベントを処理
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id)
  
  if (session.mode === 'subscription' && session.customer) {
    const customerId = session.customer as string
    
    // ユーザーのサブスクリプション状態を更新
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (user) {
      console.log(`Updating user ${user.id} subscription status after checkout`)
      
      // フレーズ生成回数をリセット（新しいサブスクリプション）
      await prisma.user.update({
        where: { id: user.id },
        data: {
          remainingPhraseGenerations: 100, // ベーシックプランの初期値
        }
      })
    }
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id)
  
  const customerId = subscription.customer as string
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (user) {
    console.log(`User ${user.id} subscription created: ${subscription.id}`)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        remainingPhraseGenerations: 100, // ベーシックプランの初期値
      }
    })
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id, 'Status:', subscription.status)
  
  const customerId = subscription.customer as string
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (user) {
    console.log(`User ${user.id} subscription updated: ${subscription.id}`)
    
    // サブスクリプションがキャンセルされた場合は生成回数を0にリセット
    if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          remainingPhraseGenerations: 0,
        }
      })
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id)
  
  const customerId = subscription.customer as string
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId }
  })

  if (user) {
    console.log(`User ${user.id} subscription deleted: ${subscription.id}`)
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        remainingPhraseGenerations: 0,
      }
    })
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any
  if (invoiceData.subscription) {
    const customerId = invoice.customer as string
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (user) {
      console.log(`User ${user.id} payment succeeded for subscription: ${invoiceData.subscription}`)
      
      // 支払い成功時にフレーズ生成回数をリセット（月次更新）
      await prisma.user.update({
        where: { id: user.id },
        data: {
          remainingPhraseGenerations: 100, // ベーシックプランの月次リセット
        }
      })
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const invoiceData = invoice as any
  if (invoiceData.subscription) {
    const customerId = invoice.customer as string
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (user) {
      console.log(`User ${user.id} payment failed for subscription: ${invoiceData.subscription}`)
      // 支払い失敗時の処理（必要に応じて）
    }
  }
}
