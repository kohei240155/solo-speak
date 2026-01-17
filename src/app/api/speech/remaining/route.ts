import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, createErrorResponse } from "@/utils/api-helpers";
import { RemainingSpeechCountResponse } from "@/types/speech";
import { prisma } from "@/utils/prisma";
import { canReset } from "@/utils/timezone";

/**
 * ユーザーの残りのスピーチ回数を取得
 * @param request - Next.jsのリクエストオブジェクト
 * @returns RemainingSpeechCountResponse - 残りのスピーチ回数
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
				remainingSpeechCount: true,
				lastSpeechCountResetDate: true,
				timezone: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		let remainingSpeechCount = user.remainingSpeechCount;
		const lastResetDate = user.lastSpeechCountResetDate;
		const userTimezone = user.timezone || "UTC";

		// 日付リセットロジック（ユーザーのローカルタイムゾーン基準 + 20時間ルール）
		if (canReset(userTimezone, lastResetDate)) {
			// リセット実行
			remainingSpeechCount = 1;
			await prisma.user.update({
				where: { id: userId },
				data: {
					remainingSpeechCount: 1,
					lastSpeechCountResetDate: new Date(),
				},
			});
		}

		const result: RemainingSpeechCountResponse = {
			remainingSpeechCount,
		};

		return NextResponse.json(result);
	} catch (error) {
		return createErrorResponse(error);
	}
}
