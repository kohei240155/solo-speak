import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { getLocalDateString } from "@/utils/timezone";
import type { PracticeMode } from "@/types/practice";
import { PRACTICE_MASTERY_COUNT, PRACTICE_DEFAULT_SESSION_SIZE } from "@/types/practice";

/**
 * GET /api/phrase/practice
 * 練習対象フレーズを取得
 */
export async function GET(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { searchParams } = new URL(request.url);
		const languageId = searchParams.get("languageId");
		const mode = searchParams.get("mode") as PracticeMode | null;
		const questionCountParam = searchParams.get("questionCount");
		// 0 = 全て、未指定 = デフォルト値
		const questionCount = questionCountParam !== null
			? parseInt(questionCountParam, 10)
			: PRACTICE_DEFAULT_SESSION_SIZE;

		// バリデーション
		if (!languageId) {
			return NextResponse.json(
				{ error: "languageId parameter is required" },
				{ status: 400 }
			);
		}

		if (!mode || (mode !== "normal" && mode !== "review")) {
			return NextResponse.json(
				{ error: 'mode parameter must be "normal" or "review"' },
				{ status: 400 }
			);
		}

		// ユーザー情報取得（Practice設定含む）
		let user = await prisma.user.findUnique({
			where: { id: authResult.user.id },
			select: {
				id: true,
				practiceIncludeExisting: true,
				practiceStartDate: true,
				timezone: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// practiceStartDateが未設定の場合、現在時刻を設定
		// これにより「既存のフレーズを含める」がオフの場合、この時点以降のフレーズのみが対象になる
		if (!user.practiceStartDate) {
			const updatedUser = await prisma.user.update({
				where: { id: authResult.user.id },
				data: { practiceStartDate: new Date() },
				select: {
					id: true,
					practiceIncludeExisting: true,
					practiceStartDate: true,
					timezone: true,
				},
			});
			user = updatedUser;
		}

		// 言語の存在確認
		const language = await prisma.language.findUnique({
			where: { id: languageId, deletedAt: null },
		});

		if (!language) {
			return NextResponse.json(
				{ error: `Language with id '${languageId}' not found` },
				{ status: 404 }
			);
		}

		// ユーザーのタイムゾーンで今日の日付を取得
		const timezone = user.timezone || "UTC";
		const todayString = getLocalDateString(new Date(), timezone);

		// フレーズ取得の条件を構築
		const whereCondition: Record<string, unknown> = {
			userId: authResult.user.id,
			languageId: languageId,
			deletedAt: null,
			speechId: null, // Add Speechで追加されたフレーズを除外
		};

		// practiceIncludeExisting の設定に基づくフィルタリング
		if (!user.practiceIncludeExisting && user.practiceStartDate) {
			whereCondition.createdAt = {
				gte: user.practiceStartDate,
			};
		}

		// モードに基づく正解回数フィルタリング
		if (mode === "normal") {
			// 通常モード: 未マスター（0〜4）
			whereCondition.practiceCorrectCount = {
				lt: PRACTICE_MASTERY_COUNT,
			};
		} else {
			// 復習モード: マスター済み（5）
			whereCondition.practiceCorrectCount = {
				gte: PRACTICE_MASTERY_COUNT,
			};
		}

		// フレーズを取得
		const phrases = await prisma.phrase.findMany({
			where: whereCondition,
			include: {
				language: true,
			},
			orderBy: {
				createdAt: "asc", // 登録日時が古い順
			},
		});

		// 今日すでに正解したフレーズを除外
		const filteredPhrases = phrases.filter((phrase) => {
			if (!phrase.lastPracticeDate) return true;
			const lastPracticeDateString = getLocalDateString(
				phrase.lastPracticeDate,
				timezone
			);
			return lastPracticeDateString !== todayString;
		});

		// 指定された出題数分だけ取得（0の場合は全て）
		const sessionPhrases = questionCount > 0
			? filteredPhrases.slice(0, questionCount)
			: filteredPhrases;

		// レスポンス形式に変換
		const responsePhrases = sessionPhrases.map((phrase) => ({
			id: phrase.id,
			original: phrase.original,
			translation: phrase.translation,
			practiceCorrectCount: phrase.practiceCorrectCount,
			createdAt: phrase.createdAt.toISOString(),
		}));

		return NextResponse.json({
			success: true,
			phrases: responsePhrases,
			totalCount: filteredPhrases.length, // 全体の残り数
		});
	} catch (error) {
		console.error("Error in GET /api/phrase/practice:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
