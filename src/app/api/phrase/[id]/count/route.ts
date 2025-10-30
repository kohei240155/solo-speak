import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";
import { PhraseCountResponse } from "@/types/phrase";
import { ApiErrorResponse } from "@/types/api";

/** * フレーズの音読回数を更新するAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（フレーズID）
 * @returns PhraseCountResponse - 更新されたフレーズの音読回数
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const { id: phraseId } = await params;

		if (!phraseId) {
			const errorResponse: ApiErrorResponse = {
				error: "Phrase ID is required",
			};
			return NextResponse.json(errorResponse, { status: 400 });
		}

		// リクエストボディから増加するカウント数を取得（0以上の値を許可）
		const body = await request.json().catch(() => ({}));
		const countIncrement = Math.max(0, parseInt(body.count) || 0); // 0以上、デフォルトは0

		// フレーズが存在するかチェック（認証されたユーザーのフレーズのみ）
		const existingPhrase = await prisma.phrase.findUnique({
			where: {
				id: phraseId,
				userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
			},
		});

		if (!existingPhrase) {
			const errorResponse: ApiErrorResponse = {
				error: "Phrase not found or you do not have permission to access it",
			};
			return NextResponse.json(errorResponse, { status: 404 });
		}

		const currentDate = new Date();

		// dailySpeakCount を単純に増加

		// トランザクションで音読回数の更新とspeak_logsの記録を同時に実行
		const updatedPhrase = await prisma.$transaction(async (prisma) => {
			// 更新データを準備
			const updateData: {
				lastSpeakDate: Date;
				sessionSpoken: boolean;
				totalSpeakCount?: { increment: number };
				dailySpeakCount?: { increment: number };
			} = {
				lastSpeakDate: currentDate,
				sessionSpoken: true, // セッション中にSpeak練習済みとマーク
			};

			// カウントが0より大きい場合のみカウントを増加
			if (countIncrement > 0) {
				updateData.totalSpeakCount = { increment: countIncrement };
				updateData.dailySpeakCount = { increment: countIncrement };
			}

			// 音読回数を更新
			const phrase = await prisma.phrase.update({
				where: { id: phraseId },
				data: updateData,
				include: {
					language: true,
				},
			});

			// speak_logsテーブルに記録を追加（countが0より大きい場合のみ）
			if (countIncrement > 0) {
				await prisma.speakLog.create({
					data: {
						phraseId: phraseId,
						date: currentDate,
						count: countIncrement,
					},
				});
			}

			return phrase;
		});

		const responseData: PhraseCountResponse = {
			success: true,
			phrase: {
				id: updatedPhrase.id,
				original: updatedPhrase.original,
				translation: updatedPhrase.translation,
				totalSpeakCount: updatedPhrase.totalSpeakCount,
				dailySpeakCount: updatedPhrase.dailySpeakCount,
			},
		};

		return NextResponse.json(responseData);
	} catch {
		const errorResponse: ApiErrorResponse = {
			error: "Internal server error",
		};
		return NextResponse.json(errorResponse, { status: 500 });
	}
}
