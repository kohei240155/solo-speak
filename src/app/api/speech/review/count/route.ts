import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";
import { ApiErrorResponse } from "@/types/api";
import { prisma } from "@/utils/prisma";

/**
 * 復習用スピーチカウント取得APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeechReviewCountResponse - 復習対象のスピーチ件数
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { searchParams } = new URL(request.url);
		const languageCode: string | null = searchParams.get("languageCode");
		const speakCountFilter: string | null =
			searchParams.get("speakCountFilter");
		const excludeTodayPracticed: boolean =
			searchParams.get("excludeTodayPracticed") !== "false";

		const userId = authResult.user.id;

		// 言語コードのバリデーション
		if (!languageCode) {
			const errorResponse: ApiErrorResponse = {
				error: "Language code is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// speakCountFilterのバリデーション
		if (
			speakCountFilter &&
			!["lessPractice", "lowStatus"].includes(speakCountFilter)
		) {
			const errorResponse: ApiErrorResponse = {
				error:
					"Invalid speakCountFilter value. Must be 'lessPractice' or 'lowStatus'",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// 言語の存在チェック
		const language = await prisma.language.findUnique({
			where: {
				code: languageCode,
				deletedAt: null,
			},
		});

		if (!language) {
			const errorResponse: ApiErrorResponse = {
				error: "Language not found",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		// 今日の日付範囲を計算
		const now = new Date();
		const todayStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);
		const todayEnd = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate() + 1,
		);

		// 基本のwhere条件
		type WhereConditions = {
			userId: string;
			learningLanguageId: string;
			deletedAt: null;
			OR?: Array<{
				lastPracticedAt?: null | { lt: Date } | { gte: Date };
			}>;
		};

		const whereConditions: WhereConditions = {
			userId,
			learningLanguageId: language.id,
			deletedAt: null,
		};

		// 今日練習したスピーチを除外する条件
		if (excludeTodayPracticed) {
			whereConditions.OR = [
				{
					lastPracticedAt: null,
				},
				{
					lastPracticedAt: {
						lt: todayStart,
					},
				},
				{
					lastPracticedAt: {
						gte: todayEnd,
					},
				},
			];
		}

		// スピーチの件数を取得
		const count = await prisma.speech.count({
			where: whereConditions,
		});

		return NextResponse.json({
			success: true,
			count,
		});
	} catch (error) {
		console.error("Error counting review speeches:", error);
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
