import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LANGUAGE } from "@/constants/languages";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { RankingQueryParams, SpeakRankingResponseData } from "@/types/ranking";
import { ApiErrorResponse } from "@/types/api";

/** ランキングの音読練習用APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeakRankingResponseData - 音読練習用のランキングデータ
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const queryParams: RankingQueryParams = {
			language: searchParams.get("language") || DEFAULT_LANGUAGE,
			period:
				(searchParams.get("period") as "daily" | "weekly" | "monthly") ||
				"daily",
		};
		const { language, period } = queryParams;

		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const user = authResult.user;

		// Promise.allを使用して並列処理でパフォーマンスを向上
		const [languageRecord] = await Promise.all([
			// 言語コードから言語IDを取得
			prisma.language.findFirst({
				where: {
					code: language,
					deletedAt: null, // 削除されていない言語のみ
				},
			}),
		]);

		if (!languageRecord) {
			const errorResponse: ApiErrorResponse = {
				error: "Language not found",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const languageId = languageRecord.id;

		// 期間に応じた日付条件を設定
		const now = new Date();
		let startDate: Date;

		if (period === "daily") {
			startDate = new Date(now.toDateString());
		} else if (period === "weekly") {
			startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		} else {
			// total の場合は全期間
			startDate = new Date("1970-01-01");
		}

		// Prismaを使用してSpeak Logsデータを取得
		const speakLogs = await prisma.speakLog.findMany({
			where: {
				date: {
					gte: startDate,
				},
				deletedAt: null, // 削除されていないログのみ
				phrase: {
					languageId: languageId,
					deletedAt: null, // 削除されていないフレーズのみ
				},
			},
			include: {
				phrase: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
								iconUrl: true,
								createdAt: true, // ユーザー登録日時を取得
							},
						},
					},
				},
			},
		});

		// ユーザーごとのSpeak回数を集計
		const userCounts = new Map<
			string,
			{
				userId: string;
				username: string;
				iconUrl: string | null;
				count: number;
				createdAt: Date;
			}
		>();

		speakLogs.forEach((log) => {
			const userId = log.phrase.user.id;
			const username = log.phrase.user.username || "Anonymous";
			const iconUrl = log.phrase.user.iconUrl;
			const createdAt = log.phrase.user.createdAt;
			const speakCount = log.count || 1;

			if (userCounts.has(userId)) {
				userCounts.get(userId)!.count += speakCount;
			} else {
				userCounts.set(userId, {
					userId,
					username,
					iconUrl,
					count: speakCount,
					createdAt,
				});
			}
		});

		// ランキング順にソート（同数の場合は登録日時が古い方が上位）
		const allRankedUsers = Array.from(userCounts.values()).sort((a, b) => {
			if (b.count === a.count) {
				return (
					new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
				);
			}
			return b.count - a.count;
		});

		// 上位10位まで
		const rankedUsers = allRankedUsers
			.slice(0, 10) // 上位10位まで制限
			.map((user, index) => ({
				rank: index + 1,
				userId: user.userId,
				username: user.username,
				iconUrl: user.iconUrl,
				count: user.count,
			}));

		// 現在のユーザーの順位を取得（10位圏外でも取得）
		let currentUserRank = rankedUsers.find((u) => u.userId === user.id) || null;

		// 10位圏外の場合、全データから該当ユーザーの順位を取得
		if (!currentUserRank) {
			const userIndex = allRankedUsers.findIndex((u) => u.userId === user.id);
			if (userIndex !== -1) {
				const userData = allRankedUsers[userIndex];
				currentUserRank = {
					rank: userIndex + 1,
					userId: userData.userId,
					username: userData.username,
					iconUrl: userData.iconUrl,
					count: userData.count,
				};
			}
		}

		const responseData: SpeakRankingResponseData = {
			success: true,
			topUsers: rankedUsers,
			currentUser: currentUserRank || null,
		};

		return NextResponse.json(responseData);
	} catch (error) {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
			details: error instanceof Error ? error.message : "Unknown error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
