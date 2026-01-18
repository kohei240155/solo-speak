import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { getLocalDateString } from "@/utils/timezone";
import { calculateSimilarity } from "@/utils/similarity";
import { calculateDiff } from "@/utils/diff";
import type { PracticeMode } from "@/types/practice";
import {
	PRACTICE_MASTERY_COUNT,
	PRACTICE_SIMILARITY_THRESHOLD,
} from "@/types/practice";

/**
 * POST /api/phrase/practice/answer
 * 練習回答を送信し、判定結果を返す
 */
export async function POST(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		// リクエストボディをパース
		const body = await request.json();
		const { phraseId, transcript, mode } = body as {
			phraseId?: string;
			transcript?: string;
			mode?: PracticeMode;
		};

		// バリデーション
		if (!phraseId) {
			return NextResponse.json(
				{ error: "phraseId is required" },
				{ status: 400 }
			);
		}

		if (transcript === undefined || transcript === null) {
			return NextResponse.json(
				{ error: "transcript is required" },
				{ status: 400 }
			);
		}

		if (!mode || (mode !== "normal" && mode !== "review")) {
			return NextResponse.json(
				{ error: 'mode must be "normal" or "review"' },
				{ status: 400 }
			);
		}

		// フレーズ取得
		const phrase = await prisma.phrase.findUnique({
			where: { id: phraseId },
		});

		if (!phrase) {
			return NextResponse.json(
				{ error: "Phrase not found" },
				{ status: 404 }
			);
		}

		// 所有者確認
		if (phrase.userId !== authResult.user.id) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 }
			);
		}

		// ユーザー情報取得（タイムゾーン用）
		const user = await prisma.user.findUnique({
			where: { id: authResult.user.id },
			select: { timezone: true },
		});

		const timezone = user?.timezone || "UTC";

		// 一致度計算
		const similarity = calculateSimilarity(transcript, phrase.original);
		const correct = similarity >= PRACTICE_SIMILARITY_THRESHOLD;

		// 差分計算
		const diffResult = calculateDiff(transcript, phrase.original);

		// 今日すでに正解済みかチェック
		const todayString = getLocalDateString(new Date(), timezone);
		const alreadyPracticedToday = phrase.lastPracticeDate
			? getLocalDateString(phrase.lastPracticeDate, timezone) === todayString
			: false;

		// 新しい正解回数を計算
		let newCorrectCount = phrase.practiceCorrectCount;
		let shouldUpdateLastPracticeDate = false;

		if (correct && !alreadyPracticedToday) {
			// 正解 & 今日まだ正解していない場合のみカウント増加
			newCorrectCount = Math.min(
				phrase.practiceCorrectCount + 1,
				PRACTICE_MASTERY_COUNT
			);
			shouldUpdateLastPracticeDate = true;
		}

		// 新しい不正解回数を計算
		const newIncorrectCount = correct
			? phrase.practiceIncorrectCount
			: phrase.practiceIncorrectCount + 1;

		const isMastered = newCorrectCount >= PRACTICE_MASTERY_COUNT;

		// トランザクションでDBを更新
		await prisma.$transaction(async (tx) => {
			// フレーズ更新
			await tx.phrase.update({
				where: { id: phraseId },
				data: {
					practiceCorrectCount: newCorrectCount,
					practiceIncorrectCount: newIncorrectCount,
					...(shouldUpdateLastPracticeDate && {
						lastPracticeDate: new Date(),
					}),
				},
			});

			// PracticeLog作成
			await tx.practiceLog.create({
				data: {
					phraseId,
					userId: authResult.user.id,
					correct,
					similarity,
					transcript: transcript || null,
					practiceDate: new Date(),
				},
			});
		});

		return NextResponse.json({
			success: true,
			correct,
			similarity,
			expectedText: phrase.original,
			diffResult,
			newCorrectCount,
			isMastered,
		});
	} catch (error) {
		console.error("Error in POST /api/phrase/practice/answer:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
