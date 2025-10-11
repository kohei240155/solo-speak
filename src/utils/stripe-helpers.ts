import Stripe from "stripe";

// Stripe秘密鍵の確認
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Stripe configuration is missing");
}

if (!process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
  throw new Error("Invalid Stripe secret key format");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export interface SubscriptionInfo {
  isActive: boolean;
  status?: string;
  currentPeriodEnd?: Date;
  productId?: string;
  subscriptionId?: string;
}

/**
 * ユーザーのサブスクリプション状態を取得
 */
export async function getUserSubscriptionStatus(
  stripeCustomerId: string,
): Promise<SubscriptionInfo> {
  try {
    // アクティブなサブスクリプションを取得
    const activeSubscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (activeSubscriptions.data.length === 0) {
      return { isActive: false };
    }

    const subscription = activeSubscriptions.data[0];

    // より詳細な情報を取得するため、個別にサブスクリプションを取得
    const detailedSubscription = await stripe.subscriptions.retrieve(
      subscription.id,
      {
        expand: ["latest_invoice", "default_payment_method"],
      },
    );

    // キャンセル予定のサブスクリプションもチェック
    const isCanceled =
      detailedSubscription.cancel_at_period_end ||
      detailedSubscription.canceled_at;

    const productId = detailedSubscription.items.data[0]?.price
      .product as string;

    // Stripeから次回請求日を取得
    let currentPeriodEnd: Date | undefined = undefined;

    // TypeScript型定義を回避してサブスクリプションデータにアクセス
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = detailedSubscription as any;

    // current_period_endが存在する場合（通常のケース）
    if (subscriptionData.current_period_end) {
      currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
    }
    // current_period_endが存在しない場合、billing_cycle_anchorから計算
    else if (subscriptionData.billing_cycle_anchor) {
      const billingAnchor = new Date(
        subscriptionData.billing_cycle_anchor * 1000,
      );
      const now = new Date();

      // 請求サイクルアンカーから次回請求日を計算（月次の場合）
      const nextBilling = new Date(billingAnchor);

      // 現在日時よりも前の場合、月を追加していく
      while (nextBilling <= now) {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }

      currentPeriodEnd = nextBilling;
    }

    return {
      isActive: !isCanceled, // キャンセル予定の場合は非アクティブとして扱う
      status: detailedSubscription.status,
      currentPeriodEnd,
      productId,
      subscriptionId: detailedSubscription.id,
    };
  } catch {
    return { isActive: false };
  }
}

/**
 * Stripe顧客を作成
 */
export async function createStripeCustomer(
  email: string,
  userId: string,
): Promise<string> {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: {
        userId,
      },
    });

    return customer.id;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
    throw new Error("Failed to create Stripe customer");
  }
}

/**
 * サブスクリプション用のチェックアウトセッションを作成
 */
export async function createCheckoutSession(
  stripeCustomerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return session.url || "";
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
    throw new Error("Failed to create checkout session");
  }
}

/**
 * サブスクリプションをキャンセル（即座に無効化）
 */
export async function cancelSubscription(
  subscriptionId: string,
): Promise<void> {
  try {
    // 即座にキャンセルする（期間終了を待たない）
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
    throw new Error("Failed to cancel subscription");
  }
}

/**
 * カスタマーポータルセッションを作成（サブスクリプション管理用）
 */
export async function createCustomerPortalSession(
  stripeCustomerId: string,
  returnUrl: string,
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return session.url;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to create customer portal session: ${error.message}`,
      );
    }
    throw new Error("Failed to create customer portal session");
  }
}
export { stripe };
