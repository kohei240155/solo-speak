import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { SpeakPhraseResponse } from "@/types/phrase";
import { ApiErrorResponse } from "@/types/api";

/** * フレーズの音読練習用APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（フレーズID）
 * @returns SpeakPhraseResponse - 音読練習用のフレーズデータ
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { id } = await params;

		// フレーズを取得（削除されていないもののみ、認証されたユーザーのもののみ）
		const phrase = await prisma.phrase.findUnique({
			where: {
				id,
				userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
				deletedAt: null, // 削除されていないフレーズのみ
			},
			include: {
				language: true,
			},
		});

		if (!phrase) {
			const errorResponse: ApiErrorResponse = {
				error: "Phrase not found or access denied",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		const responseData: SpeakPhraseResponse = {
			success: true,
			phrase: {
				id: phrase.id,
				original: phrase.original,
				translation: phrase.translation,
				explanation: phrase.explanation || undefined,
				totalSpeakCount: phrase.totalSpeakCount || 0,
				dailySpeakCount: phrase.dailySpeakCount || 0,
				languageCode: phrase.language.code,
			},
		};

		return NextResponse.json(responseData);
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
