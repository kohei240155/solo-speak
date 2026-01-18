import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { getLocalDateString } from "@/utils/timezone";
import { calculateSimilarity } from "@/utils/similarity";
import { calculateDiff } from "@/utils/diff";
import {
	PRACTICE_MASTERY_COUNT,
	PRACTICE_SIMILARITY_THRESHOLD,
} from "@/types/practice";

// Zodスキーマ定義
const practiceAnswerSchema = z.object({
	phraseId: z.string().min(1, "phraseId is required"),
	transcript: z.string({ required_error: "transcript is required" }),
	mode: z.enum(["normal", "review"], {
		errorMap: () => ({ message: 'mode must be "normal" or "review"' }),
	}),
});

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

		// リクエストボディをパース & Zodバリデーション
		const body = await request.json();
		const parseResult = practiceAnswerSchema.safeParse(body);

		if (!parseResult.success) {
			const errorMessage = parseResult.error.issues[0]?.message || "Invalid parameters";
			return NextResponse.json({ error: errorMessage }, { status: 400 });
		}

		const { phraseId, transcript, mode } = parseResult.data;

		// フレーズ取得（言語情報を含める）
		const phrase = await prisma.phrase.findUnique({
			where: { id: phraseId },
			include: { language: true },
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

		// 差分計算（言語コードを渡して言語に応じた処理を行う）
		const diffResult = calculateDiff(
			transcript,
			phrase.original,
			phrase.language?.code
		);

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
