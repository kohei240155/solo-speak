import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { SpeechListResponseData } from "@/types/speech";
import { ApiErrorResponse } from "@/types/api";
import { prisma } from "@/utils/prisma";

/**
 * スピーチ一覧取得APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeechListResponseData - スピーチ一覧データ
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { searchParams } = new URL(request.url);
		const languageCode: string | null = searchParams.get("languageCode");
		const page: number = parseInt(searchParams.get("page") || "1");
		const limit: number = parseInt(searchParams.get("limit") || "10");
		const offset: number = (page - 1) * limit;

		// 認証されたユーザーのIDを使用
		const userId = authResult.user.id;

		// 言語コードのバリデーション
		if (!languageCode) {
			const errorResponse: ApiErrorResponse = {
				error: "Language code is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// 言語の存在チェック
		const language = await prisma.language.findUnique({
			where: {
				code: languageCode,
				deletedAt: null,
			},
		});

		if (!language) {
			const errorResponse: ApiErrorResponse = {
				error: "Language not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// スピーチ一覧とカウントを並列取得
		const [speeches, total] = await Promise.all([
			prisma.speech.findMany({
				where: {
					userId,
					learningLanguageId: language.id,
					deletedAt: null,
				},
				include: {
					status: {
						select: {
							id: true,
							name: true,
							description: true,
						},
					},
					phrases: {
						where: {
							speechOrder: 1,
							deletedAt: null,
						},
						select: {
							original: true,
						},
						take: 1,
					},
				},
				orderBy: {
					createdAt: "desc",
				},
				take: limit,
				skip: offset,
			}),
			prisma.speech.count({
				where: {
					userId,
					learningLanguageId: language.id,
					deletedAt: null,
				},
			}),
		]);

		// レスポンスデータの変換
		const responseData: SpeechListResponseData = {
			success: true,
			speeches: speeches.map((speech) => ({
				id: speech.id,
				title: speech.title,
				firstPhrase: {
					original: speech.phrases[0]?.original || "",
				},
				practiceCount: speech.practiceCount,
				status: {
					id: speech.status.id,
					name: speech.status.name,
					description: speech.status.description || undefined,
				},
				lastPracticedAt: speech.lastPracticedAt
					? speech.lastPracticedAt.toISOString()
					: null,
				createdAt: speech.createdAt.toISOString(),
			})),
			pagination: {
				total,
				limit,
				page,
				hasMore: offset + limit < total,
			},
		};

		return NextResponse.json(responseData);
	} catch (error) {
		console.error("Error fetching speeches:", error);
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
