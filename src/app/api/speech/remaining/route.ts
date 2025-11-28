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
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const result: RemainingSpeechCountResponse = {
			remainingSpeechCount: user.remainingSpeechCount,
		};

		return NextResponse.json(result);
	} catch (error) {
		return createErrorResponse(error);
	}
}
