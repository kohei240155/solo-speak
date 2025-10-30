import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import {
	createStripeCustomer,
	createCheckoutSession,
} from "@/utils/stripe-helpers";

/** * Stripe Checkoutセッションを作成するAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns { sessionId: string } - 作成されたCheckoutセッションのID
 */
export async function POST(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const userId = authResult.user.id;

		// ユーザー情報を取得
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				email: true,
				stripeCustomerId: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		let stripeCustomerId = user.stripeCustomerId;

		// Stripe顧客が存在しない場合は作成
		if (!stripeCustomerId) {
			stripeCustomerId = await createStripeCustomer(user.email, userId);

			// データベースに保存
			await prisma.user.update({
				where: { id: userId },
				data: { stripeCustomerId },
			});
		}

		// 環境変数から価格IDを取得（実際のStripeで作成した価格ID）
		const priceId = process.env.STRIPE_PRICE_ID;

		if (!priceId || priceId === "your_stripe_price_id_here") {
			return NextResponse.json(
				{ error: "Stripe configuration not complete" },
				{ status: 500 },
			);
		}

		// チェックアウトセッションを作成
		const checkoutUrl = await createCheckoutSession(
			stripeCustomerId,
			priceId,
			`${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=subscription&success=true`,
			`${process.env.NEXT_PUBLIC_SITE_URL}/settings?tab=subscription&canceled=true`,
		);

		return NextResponse.json({ checkoutUrl });
	} catch {
		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}
