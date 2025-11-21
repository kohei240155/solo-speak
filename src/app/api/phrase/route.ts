import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/utils/api-helpers";
import { getPhraseLevelScoreByCorrectAnswers } from "@/utils/phrase-level-utils";
import {
	CreatePhraseRequestBody,
	CreatePhraseResponseData,
	PhrasesListResponseData,
	PhraseData,
} from "@/types/phrase";
import { ApiErrorResponse } from "@/types/api";
import { prisma } from "@/utils/prisma";

const createPhraseSchema = z.object({
	languageCode: z.string().min(1),
	original: z.string().min(1).max(200),
	translation: z.string().min(1).max(200),
	explanation: z.string().optional(),
	level: z.enum(["common", "polite", "casual"]).optional(),
	phraseLevelId: z.string().optional(),
	context: z.string().nullable().optional(),
});

/** * フレーズの作成APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns CreatePhraseResponseData - 作成されたフレーズデータ
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const body: unknown = await request.json();
		const {
			languageCode,
			original,
			translation,
			explanation,
			level,
			phraseLevelId,
		}: Omit<CreatePhraseRequestBody, "context"> =
			createPhraseSchema.parse(body);

		// contextは現在保存されませんが、将来の拡張用としてスキーマには残しています

		// 認証されたユーザーIDを使用
		const userId = authResult.user.id;

		// Promise.allを使用してユーザーと言語の存在チェックを並列処理
		const [user, language] = await Promise.all([
			prisma.user.findUnique({
				where: { id: userId },
			}),

			prisma.language.findUnique({
				where: {
					code: languageCode,
					deletedAt: null, // 削除されていない言語のみ
				},
			}),
		]);

		if (!user) {
			const errorResponse: ApiErrorResponse = {
				error: "User not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		if (!language) {
			const errorResponse: ApiErrorResponse = {
				error: "Language not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// フレーズレベルIDを決定
		let finalPhraseLevelId = phraseLevelId;

		if (!finalPhraseLevelId && level) {
			// levelが指定されている場合、対応するphraseLevelIdを取得
			const phraseLevel = await prisma.phraseLevel.findFirst({
				where: { name: level },
			});

			if (phraseLevel) {
				finalPhraseLevelId = phraseLevel.id;
			}
		}

		// それでもphraseLevelIdが決まらない場合、正解数（初期値0）に基づいてフレーズレベルを設定
		if (!finalPhraseLevelId) {
			const correctAnswers = 0; // 新規フレーズの初期正解数
			const levelScore = getPhraseLevelScoreByCorrectAnswers(correctAnswers);

			const phraseLevel = await prisma.phraseLevel.findFirst({
				where: { score: levelScore },
			});

			if (phraseLevel) {
				finalPhraseLevelId = phraseLevel.id;
			} else {
				// フォールバック: 最低レベルを取得
				const defaultLevel = await prisma.phraseLevel.findFirst({
					orderBy: { score: "asc" },
				});

				if (!defaultLevel) {
					const errorResponse: ApiErrorResponse = {
						error: "No phrase level found",
					};
					return NextResponse.json(errorResponse, { status: 500 });
				}

				finalPhraseLevelId = defaultLevel.id;
			}
		}

		// フレーズを作成
		const phrase = await prisma.phrase.create({
			data: {
				userId,
				languageId: language.id,
				original,
				translation,
				explanation,
				phraseLevelId: finalPhraseLevelId,
			},
			include: {
				language: {
					select: {
						id: true,
						name: true,
						code: true,
					},
				},
				phraseLevel: true,
				user: {
					select: {
						id: true,
						username: true,
					},
				},
			},
		});

		// 最新のユーザー情報を取得（残り回数は /api/user/phrase-generations で既に減らされている）
		const finalUser = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				remainingPhraseGenerations: true,
			},
		});

		// ユーザーの総フレーズ数を取得
		const totalPhraseCount = await prisma.phrase.count({
			where: {
				userId,
				deletedAt: null,
			},
		});

		// 翌日のリセット時間を計算（レスポンス用）
		const currentTime = new Date();
		const todayStart = new Date(
			currentTime.getFullYear(),
			currentTime.getMonth(),
			currentTime.getDate(),
		);
		const tomorrowStart = new Date(todayStart);
		tomorrowStart.setDate(tomorrowStart.getDate() + 1);

		// フロントエンドの期待する形式に変換
		const transformedPhrase: PhraseData = {
			id: phrase.id,
			original: phrase.original,
			translation: phrase.translation,
			explanation: phrase.explanation || undefined,
			createdAt: phrase.createdAt.toISOString(),
			practiceCount: phrase.totalSpeakCount,
			correctAnswers: phrase.correctQuizCount,
			language: {
				name: phrase.language.name,
				code: phrase.language.code,
			},
		};

		const responseData: CreatePhraseResponseData = {
			success: true,
			phrase: transformedPhrase,
			remainingGenerations: finalUser?.remainingPhraseGenerations ?? 0,
			dailyLimit: 5,
			nextResetTime: tomorrowStart.toISOString(),
			totalPhraseCount,
		};

		return NextResponse.json(responseData, { status: 201 });
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorResponse: ApiErrorResponse = {
				error: "Invalid request data",
				details: error.issues,
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}

export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { searchParams } = new URL(request.url);
		const languageId: string | null = searchParams.get("languageId");
		const languageCode: string | null = searchParams.get("languageCode");
		const page: number = parseInt(searchParams.get("page") || "1");
		const limit: number = parseInt(searchParams.get("limit") || "10");
		const minimal: boolean = searchParams.get("minimal") === "true"; // 最小限のデータのみ取得するフラグ
		const offset: number = (page - 1) * limit;

		// 認証されたユーザーのIDを使用
		const userId = authResult.user.id;

		const where: {
			userId: string;
			languageId?: string;
			deletedAt?: null;
		} = {
			userId, // 認証されたユーザーのフレーズのみを取得
			deletedAt: null, // 削除されていないフレーズのみを取得
		};

		if (languageId) {
			where.languageId = languageId;
		}

		// languageCodeが指定されている場合の処理を並列化
		let languageForCode = null;
		if (languageCode && !languageId) {
			languageForCode = await prisma.language.findUnique({
				where: {
					code: languageCode,
					deletedAt: null, // 削除されていない言語のみ
				},
			});
			if (languageForCode) {
				where.languageId = languageForCode.id;
			}
		}

		// Promise.allを使用して並列処理でパフォーマンスを向上
		const [phrases, total] = await Promise.all([
			prisma.phrase.findMany({
				where,
				include: minimal
					? {
							// 最小限のデータのみ
							language: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
						}
					: {
							// 完全なデータ
							language: {
								select: {
									id: true,
									name: true,
									code: true,
								},
							},
							phraseLevel: true,
							user: {
								select: {
									id: true,
									username: true,
								},
							},
						},
				orderBy: {
					createdAt: "desc",
				},
				take: limit,
				skip: offset,
			}),

			prisma.phrase.count({ where }),
		]);

		// フロントエンドの期待する形式に変換
		const transformedPhrases: PhraseData[] = phrases.map((phrase) => ({
			id: phrase.id,
			original: phrase.original,
			translation: phrase.translation,
			explanation: phrase.explanation || undefined,
			createdAt: phrase.createdAt.toISOString(),
			practiceCount: phrase.totalSpeakCount,
			correctAnswers: phrase.correctQuizCount,
			language: {
				name: phrase.language.name,
				code: phrase.language.code,
			},
		}));

		const responseData: PhrasesListResponseData = {
			success: true,
			phrases: transformedPhrases,
			pagination: {
				total,
				limit,
				page,
				hasMore: offset + limit < total,
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
