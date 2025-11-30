import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { ApiErrorResponse } from "@/types/api";
import { RecordPracticeResponse } from "@/types/speech";

/**
 * Speechの練習記録APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns RecordPracticeResponse
 */
export async function POST(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
): Promise<NextResponse<RecordPracticeResponse | ApiErrorResponse>> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error as NextResponse<ApiErrorResponse>;
		}

		const { id } = await context.params;
		const userId = authResult.user.id;

		// スピーチの存在確認と権限チェック
		const speech = await prisma.speech.findUnique({
			where: {
				id,
				deletedAt: null,
			},
			select: {
				id: true,
				userId: true,
			},
		});

		if (!speech) {
			const errorResponse: ApiErrorResponse = {
				error: "Speech not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		if (speech.userId !== userId) {
			const errorResponse: ApiErrorResponse = {
				error: "Unauthorized",
			};
			return NextResponse.json(errorResponse, { status: 403 });
		}

		// 練習回数を1増やし、最終練習日を更新
		const updatedSpeech = await prisma.speech.update({
			where: {
				id,
			},
			data: {
				practiceCount: {
					increment: 1,
				},
				lastPracticedAt: new Date(),
			},
			select: {
				id: true,
				practiceCount: true,
				lastPracticedAt: true,
			},
		});

		const response: RecordPracticeResponse = {
			message: "Practice recorded successfully",
			speech: updatedSpeech,
		};

		return NextResponse.json(response, { status: 200 });
	} catch (error) {
		console.error("Error recording practice:", error);
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
