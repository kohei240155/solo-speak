import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { ApiErrorResponse } from "@/types/api";
import { prisma } from "@/utils/prisma";
import { getSpeechAudioSignedUrl } from "@/utils/storage-helpers";

/**
 * 復習用スピーチデータ取得APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeechReviewResponseData - 復習用スピーチデータ
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
		const speakCountFilter: string | null =
			searchParams.get("speakCountFilter");
		const excludeTodayPracticed: boolean =
			searchParams.get("excludeTodayPracticed") !== "false";

		const userId = authResult.user.id;

		// 言語コードのバリデーション
		if (!languageCode) {
			const errorResponse: ApiErrorResponse = {
				error: "Language code is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// speakCountFilterのバリデーション
		if (
			speakCountFilter &&
			!["lessPractice", "lowStatus"].includes(speakCountFilter)
		) {
			const errorResponse: ApiErrorResponse = {
				error:
					"Invalid speakCountFilter value. Must be 'lessPractice' or 'lowStatus'",
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

		// 今日の日付範囲を計算
		const now = new Date();
		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);
		const todayEnd = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + 1,
		);

		// 基本のwhere条件
		type WhereConditions = {
			userId: string;
			learningLanguageId: string;
			deletedAt: null;
			OR?: Array<{
				lastPracticedAt?: null | { lt: Date } | { gte: Date };
			}>;
		};

		const whereConditions: WhereConditions = {
			userId,
			learningLanguageId: language.id,
			deletedAt: null,
		};

		// 今日練習したスピーチを除外する条件
		if (excludeTodayPracticed) {
			whereConditions.OR = [
				{
					lastPracticedAt: null,
				},
				{
					lastPracticedAt: {
						lt: todayStart,
					},
				},
				{
					lastPracticedAt: {
						gte: todayEnd,
					},
				},
			];
		}

		// ソート条件を決定
		type OrderBy =
			| { createdAt: "asc" }
			| [{ practiceCount: "asc" }, { createdAt: "asc" }]
			| [{ status: { name: "asc" } }, { createdAt: "asc" }];

		let orderBy: OrderBy = { createdAt: "asc" };
		if (speakCountFilter === "lessPractice") {
			orderBy = [{ practiceCount: "asc" }, { createdAt: "asc" }];
		} else if (speakCountFilter === "lowStatus") {
			orderBy = [
				{
					status: {
						name: "asc",
					},
				},
				{ createdAt: "asc" },
			];
		}

		// スピーチデータを取得（1件のみ）
		const speech = await prisma.speech.findFirst({
			where: whereConditions,
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
						deletedAt: null,
					},
					select: {
						id: true,
						original: true,
						translation: true,
						speechOrder: true,
					},
					orderBy: {
						speechOrder: "asc",
					},
				},
				feedbacks: {
					where: {
						deletedAt: null,
					},
					select: {
						id: true,
						category: true,
						content: true,
						createdAt: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				},
			},
			orderBy,
		});

		// スピーチが見つからない場合
		if (!speech) {
			return NextResponse.json({
				success: true,
				speech: null,
			});
		}

		// 音声ファイルのURLを取得
		let audioUrl: string | null = null;
		if (speech.audioFilePath) {
			try {
				audioUrl = await getSpeechAudioSignedUrl(speech.audioFilePath);
			} catch (error) {
				console.error("Error getting audio URL:", error);
				// 音声URL取得失敗時はnullのまま続行
			}
		}

		// レスポンスデータの変換
		const responseData = {
			success: true,
			speech: {
				id: speech.id,
				title: speech.title,
				practiceCount: speech.practiceCount,
				status: {
					id: speech.status.id,
					name: speech.status.name,
					description: speech.status.description || undefined,
				},
				firstSpeechText: speech.firstSpeechText,
				audioFilePath: audioUrl,
				notes: speech.notes,
				lastPracticedAt: speech.lastPracticedAt
					? speech.lastPracticedAt.toISOString()
					: null,
				createdAt: speech.createdAt.toISOString(),
				phrases: speech.phrases.map((phrase) => ({
					id: phrase.id,
					original: phrase.original,
					translation: phrase.translation,
					speechOrder: phrase.speechOrder || 0,
				})),
				feedbacks: speech.feedbacks.map((feedback) => ({
					id: feedback.id,
					category: feedback.category,
					content: feedback.content,
					createdAt: feedback.createdAt.toISOString(),
				})),
			},
		};

		return NextResponse.json(responseData);
	} catch (error) {
		console.error("Error fetching review speech:", error);
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
