import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, createErrorResponse } from "@/utils/api-helpers";
import { RemainingSpeechCountResponse } from "@/types/speech";
import { prisma } from "@/utils/prisma";

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
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		let remainingSpeechCount = user.remainingSpeechCount;
		const lastResetDate = user.lastSpeechCountResetDate;

		// 日付リセットロジック（UTC基準）
		const now = new Date();
		const todayUTC = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
		);

		if (!lastResetDate) {
			// 初回の場合は1回に設定
			remainingSpeechCount = 1;
			await prisma.user.update({
				where: { id: userId },
				data: {
					remainingSpeechCount: 1,
					lastSpeechCountResetDate: new Date(),
				},
			});
		} else {
			const lastResetDateUTC = new Date(lastResetDate);
			const lastResetDayUTC = new Date(
				Date.UTC(
					lastResetDateUTC.getUTCFullYear(),
					lastResetDateUTC.getUTCMonth(),
					lastResetDateUTC.getUTCDate(),
				),
			);

			// 最後のリセット日が今日より前の場合のリセット処理（UTC基準）
			if (lastResetDayUTC.getTime() < todayUTC.getTime()) {
				remainingSpeechCount = 1;
				await prisma.user.update({
					where: { id: userId },
					data: {
						remainingSpeechCount: 1,
						lastSpeechCountResetDate: new Date(),
					},
				});
			}
		}

		const result: RemainingSpeechCountResponse = {
			remainingSpeechCount,
		};

		return NextResponse.json(result);
	} catch (error) {
		return createErrorResponse(error);
	}
}
