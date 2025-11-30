import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { prisma } from "@/utils/prisma";
import { ApiErrorResponse } from "@/types/api";
import {
	UpdateSpeechNotesRequest,
	UpdateSpeechNotesResponse,
} from "@/types/speech";

/**
 * スピーチノート更新APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ
 * @returns UpdatedSpeechNotesResponse
 */
export async function PUT(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
): Promise<NextResponse<UpdateSpeechNotesResponse | ApiErrorResponse>> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error as NextResponse<ApiErrorResponse>;
		}

		const { id } = await context.params;
		const userId = authResult.user.id;

		// リクエストボディの取得
		const body: UpdateSpeechNotesRequest = await request.json();
		const { notes } = body;

		// バリデーション
		if (typeof notes !== "string") {
			const errorResponse: ApiErrorResponse = {
				error: "Notes must be a string",
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

		// 権限チェック：自分のスピーチのみ編集可能
		if (speech.userId !== userId) {
			const errorResponse: ApiErrorResponse = {
				error: "Unauthorized",
			};
			return NextResponse.json(errorResponse, { status: 403 });
		}

		// ノートを更新
		const updatedSpeech = await prisma.speech.update({
			where: {
				id,
			},
			data: {
				notes,
			},
			select: {
				id: true,
				notes: true,
			},
		});

		const response: UpdateSpeechNotesResponse = {
			message: "Notes updated successfully",
			speech: {
				id: updatedSpeech.id,
				notes: updatedSpeech.notes ?? "",
			},
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error updating speech notes:", error);
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
