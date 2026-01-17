import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { ApiErrorResponse } from "@/types/api";
import { UserDailyResetResponse } from "@/types/user";
import { canReset } from "@/utils/timezone";

/** * ユーザーの1日ごとの音読練習回数をリセットするAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns UserDailyResetResponse - リセット結果とメッセージ
 */
export async function POST(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const userId = authResult.user.id;

		// 現在のユーザー情報を取得
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				lastDailySpeakCountResetDate: true,
				timezone: true,
			},
		});

		if (!user) {
			const errorResponse: ApiErrorResponse = {
				error: "User not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		const userTimezone = user.timezone || "UTC";

		let shouldReset = false;
		let resetCount = 0;

		// ユーザーのローカルタイムゾーン基準 + 20時間ルールでリセット判定
		if (canReset(userTimezone, user.lastDailySpeakCountResetDate)) {
			shouldReset = true;
		}

		if (shouldReset) {
			// ユーザーに紐づく全てのフレーズのdailySpeakCountを0にリセット
			const updateResult = await prisma.phrase.updateMany({
				where: {
					userId: userId,
					deletedAt: null,
				},
				data: {
					dailySpeakCount: 0,
				},
			});

			resetCount = updateResult.count;

			// ユーザーのlastDailySpeakCountResetDateを現在時刻に更新
			await prisma.user.update({
				where: { id: userId },
				data: {
					lastDailySpeakCountResetDate: new Date(),
				},
			});
		}

		const responseData: UserDailyResetResponse = {
			success: true,
			reset: shouldReset,
			message: shouldReset
				? `Reset dailySpeakCount for ${resetCount} phrases`
				: "No reset needed - already practiced today",
			count: resetCount,
			lastDailySpeakCountResetDate: user.lastDailySpeakCountResetDate,
		};

		return NextResponse.json(responseData);
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
