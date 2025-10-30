import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { SpeakPhraseCountResponse } from "@/types/phrase";
import { ApiErrorResponse } from "@/types/api";

/**
 * Speak用フレーズの数を取得するAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeakPhraseCountResponse - 条件に一致するフレーズの数
 */
export async function GET(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { searchParams } = new URL(request.url);
		const language = searchParams.get("language");
		const excludeIfSpeakCountGTE = searchParams.get("excludeIfSpeakCountGTE");
		const excludeTodayPracticed =
			searchParams.get("excludeTodayPracticed") === "true";

		if (!language) {
			const errorResponse: ApiErrorResponse = {
				error: "Language parameter is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// モード設定をクエリパラメータから取得
		const config = {
			excludeIfSpeakCountGTE: excludeIfSpeakCountGTE
				? parseInt(excludeIfSpeakCountGTE, 10)
				: undefined,
			excludeTodayPracticed,
		};

		// フィルタリング条件を構築
		const whereClause = {
			userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
			language: {
				code: language,
			},
			deletedAt: null, // 削除されていないフレーズのみ
			sessionSpoken: false, // セッション中にまだSpeak練習していないフレーズのみ
			...(config.excludeTodayPracticed && {
				dailySpeakCount: { equals: 0 }, // 今日練習済みを除外する場合：今日の練習回数が0のフレーズのみ
			}),
			...(config.excludeIfSpeakCountGTE !== undefined && {
				totalSpeakCount: {
					lt: config.excludeIfSpeakCountGTE, // 指定された回数未満のフレーズのみ（指定回数以上を除外）
				},
			}),
		};

		// Promise.allを使用して並列処理でパフォーマンスを向上
		const [languageExists, phraseCount] = await Promise.all([
			// 指定された言語が存在するか確認
			prisma.language.findUnique({
				where: {
					code: language,
					deletedAt: null, // 削除されていない言語のみ
				},
			}),

			// データベースからフレーズ数を取得（削除されていないもののみ）
			// 認証されたユーザーのフレーズのみを対象
			prisma.phrase.count({
				where: whereClause,
			}),
		]);

		if (!languageExists) {
			const errorResponse: SpeakPhraseCountResponse = {
				success: false,
				count: 0,
				message: `Language with code '${language}' not found`,
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		const responseData: SpeakPhraseCountResponse = {
			success: true,
			count: phraseCount,
		};

		return NextResponse.json(responseData);
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
