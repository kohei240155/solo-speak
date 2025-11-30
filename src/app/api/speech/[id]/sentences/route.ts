import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { ApiErrorResponse } from "@/types/api";
import { prisma } from "@/utils/prisma";
import { SpeakPhrase } from "@/types/speak";

interface SpeechSentencesResponse {
	sentences: SpeakPhrase[];
}

/**
 * スピーチに紐づくセンテンス一覧取得APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（スピーチID）
 * @returns SpeechSentencesResponse - センテンス一覧データ（SpeakPhrase型）
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { id } = await params;

		// スピーチの存在確認（認証されたユーザーのスピーチのみ）
		const speech = await prisma.speech.findUnique({
			where: {
				id,
				userId: authResult.user.id,
				deletedAt: null,
			},
			include: {
				phrases: {
					where: {
						deletedAt: null,
					},
					select: {
						id: true,
						original: true,
						translation: true,
						totalSpeakCount: true,
						dailySpeakCount: true,
						speechOrder: true,
						explanation: true,
					},
					orderBy: {
						speechOrder: "asc",
					},
				},
			},
		});

		if (!speech) {
			const errorResponse: ApiErrorResponse = {
				error: "Speech not found or access denied",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// SpeakPhrase型に変換
		const sentences: SpeakPhrase[] = speech.phrases.map((phrase) => ({
			id: phrase.id,
			original: phrase.original,
			translation: phrase.translation,
			totalSpeakCount: phrase.totalSpeakCount,
			dailySpeakCount: phrase.dailySpeakCount,
			explanation: phrase.explanation ?? undefined,
		}));

		const responseData: SpeechSentencesResponse = {
			sentences,
		};

		return NextResponse.json(responseData);
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
