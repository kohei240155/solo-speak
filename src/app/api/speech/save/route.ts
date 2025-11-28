import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/utils/api-helpers";
import { uploadSpeechAudio } from "@/utils/storage-helpers";
import { prisma } from "@/utils/prisma";
import { SaveSpeechRequestBody, SaveSpeechResponseData } from "@/types/speech";
import { ApiErrorResponse } from "@/types/api";

// バリデーションスキーマ
const sentenceSchema = z.object({
	learningLanguage: z.string().min(1).max(500),
	nativeLanguage: z.string().min(1).max(500),
});

const feedbackSchema = z.object({
	category: z.string().min(1).max(100),
	content: z.string().min(1).max(2000),
});

const saveSpeechSchema = z.object({
	title: z.string().min(1).max(200),
	learningLanguageId: z.string().min(1),
	nativeLanguageId: z.string().min(1),
	firstSpeechText: z.string().min(1),
	notes: z.string().optional(),
	speechPlans: z.array(z.string().min(1)).min(1),
	sentences: z.array(sentenceSchema).min(1),
	feedback: z.array(feedbackSchema).optional().default([]),
});

/**
 * スピーチ結果を保存するAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SaveSpeechResponseData - 保存されたスピーチデータ
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const userId = authResult.user.id;

		// FormDataの解析
		const formData = await request.formData();
		const dataString = formData.get("data") as string;
		const audioFile = formData.get("audio") as File | null;

		if (!dataString) {
			const errorResponse: ApiErrorResponse = {
				error: "Data field is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// JSONデータのパース
		let parsedData: SaveSpeechRequestBody;
		try {
			const rawData = JSON.parse(dataString);
			parsedData = saveSpeechSchema.parse(rawData);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errorResponse: ApiErrorResponse = {
					error: error.errors[0]?.message || "Validation error",
				};
				return NextResponse.json(errorResponse, { status: 400 });
			}
			const errorResponse: ApiErrorResponse = {
				error: "Invalid JSON format",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// ユーザーの存在確認とスピーチ回数チェック
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				remainingSpeechCount: true,
			},
		});

		if (!user) {
			const errorResponse: ApiErrorResponse = {
				error: "User not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		if (user.remainingSpeechCount <= 0) {
			const errorResponse: ApiErrorResponse = {
				error: "No remaining speech count",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// 言語の存在確認
		const [learningLanguage, nativeLanguage] = await Promise.all([
			prisma.language.findUnique({
				where: {
					id: parsedData.learningLanguageId,
					deletedAt: null,
				},
			}),
			prisma.language.findUnique({
				where: {
					id: parsedData.nativeLanguageId,
					deletedAt: null,
				},
			}),
		]);

		if (!learningLanguage) {
			const errorResponse: ApiErrorResponse = {
				error: "Learning language not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		if (!nativeLanguage) {
			const errorResponse: ApiErrorResponse = {
				error: "Native language not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// デフォルトのスピーチステータスを取得（D: スピーチをしただけで練習していない）
		const defaultStatus = await prisma.speechStatus.findFirst({
			where: { name: "D" },
		});

		if (!defaultStatus) {
			const errorResponse: ApiErrorResponse = {
				error: "Default speech status not found",
			};
			return NextResponse.json(errorResponse, { status: 500 });
		}

		// デフォルトのフレーズレベルを取得
		const defaultPhraseLevel = await prisma.phraseLevel.findFirst({
			where: { score: 0 },
		});

		if (!defaultPhraseLevel) {
			const errorResponse: ApiErrorResponse = {
				error: "Default phrase level not found",
			};
			return NextResponse.json(errorResponse, { status: 500 });
		}

		// トランザクション開始
		const result = await prisma.$transaction(async (tx) => {
			// 1. Speechレコードを作成
			const speech = await tx.speech.create({
				data: {
					userId,
					title: parsedData.title,
					learningLanguageId: parsedData.learningLanguageId,
					nativeLanguageId: parsedData.nativeLanguageId,
					statusId: defaultStatus.id,
					firstSpeechText: parsedData.firstSpeechText,
					notes: parsedData.notes,
					practiceCount: 0,
				},
				include: {
					learningLanguage: true,
					nativeLanguage: true,
					status: true,
				},
			});

			// 2. 音声ファイルのアップロード（ある場合）
			let audioFilePath: string | undefined;
			if (audioFile) {
				try {
					const audioBlob = new Blob([await audioFile.arrayBuffer()], {
						type: audioFile.type,
					});
					audioFilePath = await uploadSpeechAudio(userId, speech.id, audioBlob);

					// Speechレコードを更新して音声パスを保存
					await tx.speech.update({
						where: { id: speech.id },
						data: { audioFilePath },
					});
				} catch (error) {
					console.error("Failed to upload audio:", error);
					// 音声アップロードの失敗は致命的ではないため、続行
				}
			}

			// 3. SpeechPlanレコードを作成
			const speechPlans = await Promise.all(
				parsedData.speechPlans.map((planContent) =>
					tx.speechPlan.create({
						data: {
							speechId: speech.id,
							planningContent: planContent,
						},
					}),
				),
			);

			// 4. Phraseレコードを作成
			const phrases = await Promise.all(
				parsedData.sentences.map((sentence, index) =>
					tx.phrase.create({
						data: {
							userId,
							languageId: parsedData.learningLanguageId,
							original: sentence.learningLanguage,
							translation: sentence.nativeLanguage,
							phraseLevelId: defaultPhraseLevel.id,
							speechId: speech.id,
							speechOrder: index + 1, // 1から始まる順序
						},
					}),
				),
			);

			// 5. SpeechFeedbackレコードを作成
			const feedbacks = await Promise.all(
				parsedData.feedback.map((fb) =>
					tx.speechFeedback.create({
						data: {
							speechId: speech.id,
							category: fb.category,
							content: fb.content,
						},
					}),
				),
			);

			// 6. ユーザーの残りスピーチ回数を減算
			const updatedUser = await tx.user.update({
				where: { id: userId },
				data: {
					remainingSpeechCount: {
						decrement: 1,
					},
				},
				select: {
					remainingSpeechCount: true,
				},
			});

			return {
				speech: {
					...speech,
					audioFilePath,
				},
				speechPlans,
				phrases,
				feedbacks,
				remainingSpeechCount: updatedUser.remainingSpeechCount,
			};
		});

		// レスポンスの作成
		const response: SaveSpeechResponseData = {
			success: true,
			speech: {
				id: result.speech.id,
				title: result.speech.title,
				learningLanguage: {
					id: result.speech.learningLanguage.id,
					name: result.speech.learningLanguage.name,
					code: result.speech.learningLanguage.code,
				},
				nativeLanguage: {
					id: result.speech.nativeLanguage.id,
					name: result.speech.nativeLanguage.name,
					code: result.speech.nativeLanguage.code,
				},
				firstSpeechText: result.speech.firstSpeechText,
				audioFilePath: result.speech.audioFilePath || undefined,
				notes: result.speech.notes || undefined,
				status: {
					id: result.speech.status.id,
					name: result.speech.status.name,
					description: result.speech.status.description || undefined,
				},
				practiceCount: result.speech.practiceCount,
				createdAt: result.speech.createdAt.toISOString(),
				updatedAt: result.speech.updatedAt.toISOString(),
			},
			phrases: result.phrases.map((phrase) => ({
				id: phrase.id,
				original: phrase.original,
				translation: phrase.translation,
				speechOrder: phrase.speechOrder || 0,
				createdAt: phrase.createdAt.toISOString(),
			})),
			speechPlans: result.speechPlans.map((plan) => ({
				id: plan.id,
				planningContent: plan.planningContent,
				createdAt: plan.createdAt.toISOString(),
			})),
			feedbacks: result.feedbacks.map((feedback) => ({
				id: feedback.id,
				category: feedback.category,
				content: feedback.content,
				createdAt: feedback.createdAt.toISOString(),
			})),
			remainingSpeechCount: result.remainingSpeechCount,
		};

		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("Error saving speech:", error);
		const errorResponse: ApiErrorResponse = {
			error: "Failed to save speech",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
