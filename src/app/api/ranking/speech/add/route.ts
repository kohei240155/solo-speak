import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LANGUAGE } from "@/constants/languages";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { ApiErrorResponse } from "@/types/api";

interface SpeechAddRankingResponseData {
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

/** ランキングのSpeech登録数用APIエンドポイント（Total）
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeechAddRankingResponseData - Speech登録数のランキングデータ
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

		// Speechデータを取得（登録数をカウント）
		const speeches = await prisma.speech.groupBy({
			by: ["userId"],
			where: {
				learningLanguageId: languageId,
				deletedAt: null,
			},
			_count: {
				id: true,
			},
		});

		// ユーザー情報を取得
		const userIds = speeches.map((speech) => speech.userId);
		const users = await prisma.user.findMany({
			where: {
				id: {
					in: userIds,
				},
				deletedAt: null,
			},
			select: {
				id: true,
				username: true,
				iconUrl: true,
				createdAt: true,
			},
		});

		// ユーザー情報とカウントをマージ
		const userCounts = speeches
			.map((speech) => {
				const userData = users.find((u) => u.id === speech.userId);
				if (!userData) return null;

				return {
					userId: userData.id,
					username: userData.username || "Anonymous",
					iconUrl: userData.iconUrl,
					count: speech._count.id,
					createdAt: userData.createdAt,
				};
			})
			.filter(
				(
					item,
				): item is {
					userId: string;
					username: string;
					iconUrl: string | null;
					count: number;
					createdAt: Date;
				} => item !== null && item.count > 0,
			); // 登録数が0のユーザーを除外

		// ランキング順にソート（同数の場合は登録日時が古い方が上位）
		const allRankedUsers = userCounts.sort((a, b) => {
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

		const responseData: SpeechAddRankingResponseData = {
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
