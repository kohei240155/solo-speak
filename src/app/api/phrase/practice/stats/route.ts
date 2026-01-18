import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { getLocalDateString } from "@/utils/timezone";

/**
 * GET /api/phrase/practice/stats
 * 現在のユーザーの練習統計を取得
 * - dailyCorrectCount: 今日の正解数
 * - totalCorrectCount: これまでの合計正解数
 * - weeklyRank: 今週の順位（言語別）
 * - totalRank: 累計順位（言語別）
 *
 * Query params:
 * - languageId: 言語ID（必須）
 */
export async function GET(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const userId = authResult.user.id;

		// クエリパラメータから言語IDを取得
		const { searchParams } = new URL(request.url);
		const languageId = searchParams.get("languageId");

		if (!languageId) {
			return NextResponse.json(
				{ error: "languageId is required" },
				{ status: 400 }
			);
		}

		// ユーザー情報取得（タイムゾーン用）
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { timezone: true },
		});

		const timezone = user?.timezone || "UTC";
		const todayString = getLocalDateString(new Date(), timezone);

		// 今日の開始時刻を計算（ユーザーのタイムゾーンで）
		const todayStart = new Date(`${todayString}T00:00:00`);
		// タイムゾーンオフセットを考慮
		const timezoneOffset = getTimezoneOffsetMinutes(timezone);
		todayStart.setMinutes(todayStart.getMinutes() - timezoneOffset);

		// 今日の正解数を取得（言語別）
		const dailyCorrectCount = await prisma.practiceLog.count({
			where: {
				userId,
				correct: true,
				practiceDate: {
					gte: todayStart,
				},
				phrase: {
					languageId,
				},
			},
		});

		// これまでの合計正解数を取得（言語別）
		const totalCorrectCount = await prisma.practiceLog.count({
			where: {
				userId,
				correct: true,
				phrase: {
					languageId,
				},
			},
		});

		// 今週のUTC月曜日00:00を計算
		const weekStart = getUTCMondayStart();

		// 週間ランキングを取得（言語別）
		const weeklyRank = await getWeeklyRank(userId, weekStart, languageId);

		// 累計ランキングを取得（言語別）
		const totalRank = await getTotalRank(userId, languageId);

		return NextResponse.json({
			success: true,
			dailyCorrectCount,
			totalCorrectCount,
			weeklyRank,
			totalRank,
		});
	} catch (error) {
		console.error("Error in GET /api/phrase/practice/stats:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

/**
 * タイムゾーン名からUTCからのオフセット（分）を取得
 */
function getTimezoneOffsetMinutes(timezone: string): number {
	try {
		const now = new Date();
		const utcDate = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
		const tzDate = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
		return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60);
	} catch {
		return 0; // デフォルトはUTC
	}
}

/**
 * 今週のUTC月曜日00:00を取得
 */
function getUTCMondayStart(): Date {
	const now = new Date();
	const utcDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
	// 月曜日からの日数を計算（日曜日は-6、月曜日は0、火曜日は-1、...）
	const daysFromMonday = utcDay === 0 ? 6 : utcDay - 1;

	const monday = new Date(Date.UTC(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate() - daysFromMonday,
		0, 0, 0, 0
	));

	return monday;
}

/**
 * 週間ランキングを取得（言語別）
 */
async function getWeeklyRank(userId: string, weekStart: Date, languageId: string): Promise<number> {
	// 言語別の週間正解数を取得するためにrawクエリを使用
	// groupByではリレーションでのフィルタリングができないため
	const weeklyStats = await prisma.$queryRaw<{ user_id: string; count: bigint }[]>`
		SELECT pl.user_id, COUNT(pl.id) as count
		FROM practice_logs pl
		INNER JOIN phrases p ON pl.phrase_id = p.id
		WHERE pl.correct = true
		AND pl.practice_date >= ${weekStart}
		AND p.language_id = ${languageId}
		GROUP BY pl.user_id
		ORDER BY count DESC
	`;

	// 現在のユーザーの順位を見つける
	const userIndex = weeklyStats.findIndex((stat) => stat.user_id === userId);

	if (userIndex === -1) {
		// ユーザーが今週まだ正解していない場合、最下位+1
		return weeklyStats.length + 1;
	}

	// 同点の場合の順位調整（同じ正解数の人は同順位）
	const userCount = Number(weeklyStats[userIndex].count);
	let rank = 1;
	for (let i = 0; i < userIndex; i++) {
		if (Number(weeklyStats[i].count) > userCount) {
			rank = i + 2;
		}
	}

	return rank;
}

/**
 * 累計ランキングを取得（言語別）
 */
async function getTotalRank(userId: string, languageId: string): Promise<number> {
	// 言語別の累計正解数を取得するためにrawクエリを使用
	const totalStats = await prisma.$queryRaw<{ user_id: string; count: bigint }[]>`
		SELECT pl.user_id, COUNT(pl.id) as count
		FROM practice_logs pl
		INNER JOIN phrases p ON pl.phrase_id = p.id
		WHERE pl.correct = true
		AND p.language_id = ${languageId}
		GROUP BY pl.user_id
		ORDER BY count DESC
	`;

	// 現在のユーザーの順位を見つける
	const userIndex = totalStats.findIndex((stat) => stat.user_id === userId);

	if (userIndex === -1) {
		// ユーザーがまだ正解していない場合、最下位+1
		return totalStats.length + 1;
	}

	// 同点の場合の順位調整（同じ正解数の人は同順位）
	const userCount = Number(totalStats[userIndex].count);
	let rank = 1;
	for (let i = 0; i < userIndex; i++) {
		if (Number(totalStats[i].count) > userCount) {
			rank = i + 2;
		}
	}

	return rank;
}
