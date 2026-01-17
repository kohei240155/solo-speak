import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { ApiErrorResponse } from "@/types/api";
import {
	DashboardData,
	QuizMasteryLevel,
	SpeechLevelStatistic,
} from "@/types/dashboard";
import { prisma } from "@/utils/prisma";
import {
	calculateStreak,
	formatDatesToStrings,
} from "@/utils/streak-calculator";

/**
 * ステータス名に応じた色を取得
 */
function getStatusColor(statusName: string): string {
	switch (statusName) {
		case "A":
			return "#1f2937"; // 最も濃いグレー (gray-800)
		case "B":
			return "#4b5563"; // 濃いグレー (gray-600)
		case "C":
			return "#6b7280"; // 中間グレー (gray-500)
		case "D":
			return "#9ca3af"; // 薄いグレー (gray-400)
		default:
			return "#d1d5db"; // 最も薄いグレー (gray-300)
	}
}

/**
 * ダッシュボードデータ取得APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns DashboardData - ダッシュボードに表示するデータ
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { searchParams } = new URL(request.url);
		const language = searchParams.get("language");

		if (!language) {
			const errorResponse: ApiErrorResponse = {
				error: "Language parameter is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const user = authResult.user;

		// ユーザー情報を取得してタイムゾーンを取得
		const userData = await prisma.user.findUnique({
			where: { id: user.id },
			select: { timezone: true },
		});
		const userTimezone = userData?.timezone || "UTC";

		// 言語コードから言語IDを取得
		const languageRecord = await prisma.language.findFirst({
			where: {
				code: language,
				deletedAt: null,
			},
		});

		if (!languageRecord) {
			const errorResponse: ApiErrorResponse = {
				error: "Language not found",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// 今日の日付範囲を計算（UTC基準）
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Promise.allを使用して並列処理でパフォーマンスを向上
		const [
			totalPhraseCount,
			speakCountTotal,
			allPhrases,
			allPhraseLevels,
			phrasesForStreak,
			speakLogsForStreak,
			quizLogsForStreak,
			speechesForReviewStreak,
			allSpeeches,
			allSpeechStatuses,
		] = await Promise.all([
			// 1. Total Phrase Count - 指定言語のフレーズ総数
			prisma.phrase.count({
				where: {
					userId: user.id,
					language: {
						code: language,
					},
					deletedAt: null,
				},
			}),

			// 2. Speak Count (Total) - 総スピーク回数
			prisma.speakLog.aggregate({
				_sum: {
					count: true,
				},
				where: {
					phrase: {
						userId: user.id,
						language: {
							code: language,
						},
					},
					deletedAt: null,
				},
			}),

			// 3. All Phrases by Level - レベル別フレーズ数を取得するために全フレーズを取得
			prisma.phrase.findMany({
				where: {
					userId: user.id,
					language: {
						code: language,
					},
					deletedAt: null,
				},
				include: {
					phraseLevel: true,
				},
			}),

			// 4. All Phrase Levels - 全フレーズレベル
			prisma.phraseLevel.findMany({
				where: { deletedAt: null },
				orderBy: { score: "asc" },
			}),

			// 5. Phrases for Streak - フレーズStreak計算用（SpeechIDが設定されているものは除外）
			prisma.phrase.findMany({
				where: {
					userId: user.id,
					languageId: languageRecord.id,
					deletedAt: null,
					speechId: null,
				},
				select: {
					createdAt: true,
				},
				orderBy: {
					createdAt: "asc",
				},
			}),

			// 6. Speak Logs for Streak - SpeakStreak計算用
			prisma.speakLog.findMany({
				where: {
					phrase: {
						userId: user.id,
						languageId: languageRecord.id,
						deletedAt: null,
					},
					deletedAt: null,
				},
				select: {
					date: true,
				},
				orderBy: {
					date: "asc",
				},
			}),

			// 7. Quiz Logs for Streak - QuizStreak計算用
			prisma.quizResult.findMany({
				where: {
					phrase: {
						userId: user.id,
						languageId: languageRecord.id,
						deletedAt: null,
					},
					deletedAt: null,
				},
				select: {
					date: true,
				},
				orderBy: {
					date: "asc",
				},
			}),

			// 8. Speeches for Review Streak - SpeechReviewStreak計算用
			prisma.speech.findMany({
				where: {
					userId: user.id,
					learningLanguageId: languageRecord.id,
					deletedAt: null,
					lastPracticedAt: {
						not: null,
					},
				},
				select: {
					lastPracticedAt: true,
				},
				orderBy: {
					lastPracticedAt: "asc",
				},
			}),

			// 9. All Speeches - ステータス別統計用
			prisma.speech.findMany({
				where: {
					userId: user.id,
					learningLanguageId: languageRecord.id,
					deletedAt: null,
				},
				include: {
					status: true,
				},
			}),

			// 10. All Speech Statuses - ステータス一覧
			prisma.speechStatus.findMany({
				where: { deletedAt: null },
			}),
		]);

		// Quiz Masteryデータの集計 - レベル別フレーズ総数
		const quizMastery: QuizMasteryLevel[] = allPhraseLevels.map(
			(level: { name: string; id: string; color: string | null }) => ({
				level: level.name,
				score: allPhrases.filter(
					(phrase: { phraseLevel: { id: string } | null }) =>
						phrase.phraseLevel?.id === level.id,
				).length,
				color: level.color || "#gray-500",
			}),
		);

		// Speech Level Statisticsデータの集計 - ステータス別Speech数
		const speechLevelStatistics: SpeechLevelStatistic[] = allSpeechStatuses.map(
			(status: { name: string; id: string }) => ({
				status: status.name,
				count: allSpeeches.filter(
					(speech: { status: { id: string } }) =>
						speech.status.id === status.id,
				).length,
				color: getStatusColor(status.name),
			}),
		);

		// Streak計算（ユーザーのタイムゾーンを使用）
		const phraseDates = formatDatesToStrings(
			phrasesForStreak.map((p: { createdAt: Date }) => p.createdAt),
			userTimezone,
		);
		const phraseStreak = calculateStreak(phraseDates, userTimezone);

		const speakDates = formatDatesToStrings(
			speakLogsForStreak.map((log: { date: Date }) => log.date),
			userTimezone,
		);
		const speakStreak = calculateStreak(speakDates, userTimezone);

		const quizDates = formatDatesToStrings(
			quizLogsForStreak.map((log: { date: Date }) => log.date),
			userTimezone,
		);
		const quizStreak = calculateStreak(quizDates, userTimezone);

		// Speech Review Streak計算
		const speechReviewDates = formatDatesToStrings(
			speechesForReviewStreak
				.map(
					(speech: { lastPracticedAt: Date | null }) => speech.lastPracticedAt,
				)
				.filter((date): date is Date => date !== null),
			userTimezone,
		);
		const speechReviewStreak = calculateStreak(speechReviewDates, userTimezone);

		const responseData: DashboardData = {
			totalPhraseCount,
			speakCountTotal: speakCountTotal._sum.count || 0,
			quizMastery,
			phraseStreak,
			speakStreak,
			quizStreak,
			speechReviewStreak,
			speechLevelStatistics,
		};

		return NextResponse.json(responseData);
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
