import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, createErrorResponse } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { RemainingGenerationsResponse } from "@/types/phrase";
import { canReset } from "@/utils/timezone";

/** * ユーザーの残りのフレーズ生成回数を取得
 * @param request - Next.jsのリクエストオブジェクト
 * @returns RemainingGenerationsResponse - 残りのフレーズ生成回数
 */
export async function GET(request: NextRequest) {
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
				remainingPhraseGenerations: true,
				lastPhraseGenerationDate: true,
				timezone: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		let remainingGenerations = user.remainingPhraseGenerations;
		const lastGenerationDate = user.lastPhraseGenerationDate;
		const userTimezone = user.timezone || "UTC";

		// 日付リセットロジック（ユーザーのローカルタイムゾーン基準 + 20時間ルール）
		if (canReset(userTimezone, lastGenerationDate)) {
			// リセット実行
			remainingGenerations = 5;
			await prisma.user.update({
				where: { id: userId },
				data: {
					remainingPhraseGenerations: 5,
					lastPhraseGenerationDate: new Date(),
				},
			});
		}

		const result: RemainingGenerationsResponse = {
			remainingGenerations,
		};

		return NextResponse.json(result);
	} catch (error) {
		return createErrorResponse(error);
	}
}
