import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LANGUAGE } from "@/constants/languages";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { ApiErrorResponse } from "@/types/api";

interface SpeechRankingResponseData {
	success: boolean;
	topUsers: Array<{
		rank: number;
		userId: string;
		username: string;
		iconUrl: string | null;
		count: number;
	}>;
	currentUser: {
		rank: number;
		userId: string;
		username: string;
		iconUrl: string | null;
		count: number;
	} | null;
}

/** ランキングのSpeech練習用APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeechRankingResponseData - Speech練習用のランキングデータ
 */
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const language = searchParams.get("language") || DEFAULT_LANGUAGE;

		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const user = authResult.user;

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

		const languageId = languageRecord.id;

		// Speechデータを取得（練習回数の合計）
		const speeches = await prisma.speech.findMany({
			where: {
				learningLanguageId: languageId,
				deletedAt: null,
			},
			select: {
				userId: true,
				practiceCount: true,
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

		// ユーザーごとの練習回数を集計
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

		speeches.forEach((speech) => {
			const userId = speech.user.id;
			const username = speech.user.username || "Anonymous";
			const iconUrl = speech.user.iconUrl;
			const createdAt = speech.user.createdAt;
			const practiceCount = speech.practiceCount;

			if (userCounts.has(userId)) {
				userCounts.get(userId)!.count += practiceCount;
			} else {
				userCounts.set(userId, {
					userId,
					username,
					iconUrl,
					count: practiceCount,
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
		const rankedUsers = allRankedUsers.slice(0, 10).map((user, index) => ({
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

		const responseData: SpeechRankingResponseData = {
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
