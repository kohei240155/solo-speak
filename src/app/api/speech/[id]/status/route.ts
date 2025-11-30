import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { ApiErrorResponse } from "@/types/api";

/**
 * スピーチステータス更新APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns UpdatedSpeechStatusResponse
 */
export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { id } = await context.params;
		const userId = authResult.user.id;

		// リクエストボディの取得
		const body = await request.json();
		const { statusId } = body;

		// バリデーション
		if (!statusId) {
			const errorResponse: ApiErrorResponse = {
				error: "Status ID is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

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
				error: "Unauthorized access to this speech",
			};
			return NextResponse.json(errorResponse, { status: 403 });
		}

		// ステータスの存在確認
		const status = await prisma.speechStatus.findUnique({
			where: {
				id: statusId,
				deletedAt: null,
			},
		});

		if (!status) {
			const errorResponse: ApiErrorResponse = {
				error: "Invalid status ID",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// ステータスの更新
		const updatedSpeech = await prisma.speech.update({
			where: {
				id,
			},
			data: {
				statusId: statusId,
			},
			select: {
				id: true,
				status: {
					select: {
						id: true,
						name: true,
						description: true,
					},
				},
			},
		});

		return NextResponse.json(
			{
				message: "Speech status updated successfully",
				speech: updatedSpeech,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("Error updating speech status:", error);
		return NextResponse.json(
			{ error: "Failed to update speech status" },
			{ status: 500 },
		);
	}
}
