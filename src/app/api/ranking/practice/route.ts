import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";

// Zodスキーマ定義
const rankingPracticeQuerySchema = z.object({
	language: z.string().min(1, "language parameter is required"),
	period: z.enum(["daily", "weekly", "total"], {
		errorMap: () => ({ message: 'period parameter must be "daily", "weekly", or "total"' }),
	}),
});

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
 * GET /api/ranking/practice
 * Practiceランキングを取得（正解数ベース）
 *
 * Query params:
 * - language: 言語コード（必須）例: "en", "ja"
 * - period: "daily" | "weekly" | "total"（必須）
 */
export async function GET(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { searchParams } = new URL(request.url);

		// Zodバリデーション
		const parseResult = rankingPracticeQuerySchema.safeParse({
			language: searchParams.get("language"),
			period: searchParams.get("period"),
		});

		if (!parseResult.success) {
			const errorMessage = parseResult.error.issues[0]?.message || "Invalid parameters";
			return NextResponse.json({ error: errorMessage }, { status: 400 });
		}

		const { language: languageCode, period } = parseResult.data;

		// 言語コードから言語を取得
		const language = await prisma.language.findFirst({
			where: { code: languageCode, deletedAt: null },
		});

		if (!language) {
			return NextResponse.json(
				{ error: `Language with code '${languageCode}' not found` },
				{ status: 404 }
			);
		}

		const languageId = language.id;

		// 期間に応じた日付条件を設定
		let startDate: Date | null = null;

		if (period === "daily") {
			// 今日のUTC 00:00
			const now = new Date();
			startDate = new Date(Date.UTC(
				now.getUTCFullYear(),
				now.getUTCMonth(),
				now.getUTCDate(),
				0, 0, 0, 0
			));
		} else if (period === "weekly") {
			// 今週のUTC月曜日 00:00
			startDate = getUTCMondayStart();
		}
		// totalの場合はstartDate = null（全期間）

		// 正解数ランキング: PracticeLogの正解数を集計
		const logs = await prisma.practiceLog.findMany({
			where: {
				correct: true,
				phrase: {
					languageId,
					deletedAt: null,
				},
				...(startDate && {
					practiceDate: {
						gte: startDate,
					},
				}),
			},
			include: {
				user: {
					select: {
						id: true,
						username: true,
						iconUrl: true,
						createdAt: true,
					},
				},
			},
		});

		// ユーザー別に正解数を集計
		const userCountMap = new Map<
			string,
			{
				user: {
					id: string;
					username: string | null;
					iconUrl: string | null;
					createdAt: Date;
				};
				count: number;
			}
		>();

		logs.forEach((log) => {
			const userId = log.userId;
			const current = userCountMap.get(userId);
			if (current) {
				current.count += 1;
			} else {
				userCountMap.set(userId, {
					user: log.user,
					count: 1,
				});
			}
		});

		// ランキングデータを作成（同点の場合は登録日が早い順）
		const allRankingData = Array.from(userCountMap.values()).sort((a, b) => {
			if (b.count === a.count) {
				return (
					new Date(a.user.createdAt).getTime() -
					new Date(b.user.createdAt).getTime()
				);
			}
			return b.count - a.count;
		});

		// Top 10
		const rankings = allRankingData.slice(0, 10).map((data, index) => ({
			rank: index + 1,
			userId: data.user.id,
			username: data.user.username || "Anonymous",
			iconUrl: data.user.iconUrl,
			count: data.count,
			createdAt: data.user.createdAt.toISOString(),
		}));

		// 現在ユーザーの順位を取得
		let userRanking: { rank: number; count: number } | null = null;
		const userIndex = allRankingData.findIndex(
			(d) => d.user.id === authResult.user.id
		);
		if (userIndex !== -1) {
			userRanking = {
				rank: userIndex + 1,
				count: allRankingData[userIndex].count,
			};
		}

		return NextResponse.json({
			success: true,
			rankings,
			userRanking,
		});
	} catch (error) {
		console.error("Error in GET /api/ranking/practice:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
