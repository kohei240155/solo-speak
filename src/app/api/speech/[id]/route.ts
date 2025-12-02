import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { ApiErrorResponse } from "@/types/api";
import { UpdateSpeechRequest, SpeechReviewResponseData } from "@/types/speech";
import { prisma } from "@/utils/prisma";
import { z } from "zod";
import { getSpeechAudioSignedUrl } from "@/utils/storage-helpers";

// スピーチ更新のリクエストボディ型
const updateSpeechSchema: z.ZodType<UpdateSpeechRequest> = z.object({
	title: z.string().max(50),
	phrases: z.array(
		z.object({
			phraseId: z.string(),
			original: z.string().max(500),
			translation: z.string().max(500),
		}),
	),
});

/**
 * スピーチ詳細取得APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（スピーチID）
 * @returns SpeechReviewResponseData - スピーチ詳細データ
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
				status: {
					select: {
						id: true,
						name: true,
						description: true,
					},
				},
				nativeLanguage: {
					select: {
						id: true,
						code: true,
						name: true,
					},
				},
				learningLanguage: {
					select: {
						id: true,
						code: true,
						name: true,
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
		});

		if (!speech) {
			const errorResponse: ApiErrorResponse = {
				error: "Speech not found or access denied",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// 音声ファイルのURLを取得
		let audioUrl: string | null = null;
		if (speech.audioFilePath) {
			try {
				audioUrl = await getSpeechAudioSignedUrl(speech.audioFilePath);
			} catch (error) {
				console.error("Error getting audio URL:", error);
			}
		}

		const responseData: SpeechReviewResponseData = {
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
				nativeLanguage: {
					id: speech.nativeLanguage.id,
					code: speech.nativeLanguage.code,
					name: speech.nativeLanguage.name,
				},
				learningLanguage: {
					id: speech.learningLanguage.id,
					code: speech.learningLanguage.code,
					name: speech.learningLanguage.name,
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
					speechOrder: phrase.speechOrder ?? 0,
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
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}

/**
 * スピーチ更新APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（スピーチID）
 * @returns 更新成功メッセージ
 */
export async function PUT(
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
		const body = await request.json();

		// バリデーション
		const validationResult = updateSpeechSchema.safeParse(body);
		if (!validationResult.success) {
			const errorResponse: ApiErrorResponse = {
				error: "Invalid request body",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const { title, phrases } = validationResult.data;

		// スピーチの存在確認（認証されたユーザーのスピーチのみ）
		const existingSpeech = await prisma.speech.findUnique({
			where: {
				id,
				userId: authResult.user.id,
				deletedAt: null,
			},
		});

		if (!existingSpeech) {
			const errorResponse: ApiErrorResponse = {
				error: "Speech not found or access denied",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// トランザクションでスピーチとフレーズを更新
		await prisma.$transaction(async (tx) => {
			// スピーチのタイトルを更新
			await tx.speech.update({
				where: { id },
				data: { title },
			});

			// 各フレーズを更新
			for (const phrase of phrases) {
				await tx.phrase.update({
					where: {
						id: phrase.phraseId,
						userId: authResult.user.id,
					},
					data: {
						original: phrase.original,
						translation: phrase.translation,
					},
				});
			}
		});

		return NextResponse.json({ message: "Speech updated successfully" });
	} catch (error) {
		console.error("Error updating speech:", error);
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}

/**
 * スピーチ削除APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（スピーチID）
 * @returns 削除成功メッセージ
 */
export async function DELETE(
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
		const existingSpeech = await prisma.speech.findUnique({
			where: {
				id,
				userId: authResult.user.id,
				deletedAt: null,
			},
		});

		if (!existingSpeech) {
			const errorResponse: ApiErrorResponse = {
				error: "Speech not found or access denied",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// スピーチの削除（ソフトデリート）
		await prisma.speech.update({
			where: { id },
			data: {
				deletedAt: new Date(),
			},
		});

		return NextResponse.json({ message: "Speech deleted successfully" });
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
