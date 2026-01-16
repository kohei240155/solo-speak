import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/utils/api-helpers";
import { getTranslation, getLocaleFromRequest } from "@/utils/api-i18n";
import { zodResponseFormat } from "openai/helpers/zod";
import { prisma } from "@/utils/prisma";
import { getRandomPhraseGenerationPrompt } from "@/prompts/randomPhraseGeneration";
import { LANGUAGE_NAMES, type LanguageCode } from "@/constants/languages";
import {
	EXPRESSION_PATTERNS,
	TOPICS,
} from "@/constants/expressionPatterns";
import type { PhraseVariation } from "@/types/phrase";

// 定数
const VARIATION_COUNT = 1;

const randomGeneratePhraseSchema = z.object({
	nativeLanguage: z.string().min(1),
	learningLanguage: z.string().min(1),
	selectedContext: z.string().nullable().optional(),
});

// Structured Outputs用のレスポンススキーマ
const randomPhraseVariationsSchema = z.object({
	variations: z
		.array(
			z.object({
				original: z
					.string()
					.max(200)
					.describe("学習言語での自然な表現（200文字以内）"),
				translation: z.string().describe("ユーザーの母国語での翻訳"),
				explanation: z
					.string()
					.describe("表現の解説（構文パターンと応用ヒント、必ず2文）"),
			}),
		)
		.length(VARIATION_COUNT)
		.describe("構文パターンに基づく1つの表現"),
});

/**
 * ランダムに構文パターンとトピックを選択する
 */
function getRandomElements(situation?: string) {
	const patternIndex = Math.floor(Math.random() * EXPRESSION_PATTERNS.length);
	const pattern = EXPRESSION_PATTERNS[patternIndex];
	const topic = situation || TOPICS[Math.floor(Math.random() * TOPICS.length)];
	return { pattern, topic };
}

/** ランダムフレーズ生成APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns RandomGeneratePhraseResponse - 生成されたランダムフレーズ
 */
export async function POST(request: NextRequest) {
	try {
		// リクエストから言語を取得
		const locale = getLocaleFromRequest(request);

		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const body = await request.json();
		const { nativeLanguage, learningLanguage, selectedContext } =
			randomGeneratePhraseSchema.parse(body);

		const userId = authResult.user.id;

		// 生成前に残り回数をチェック
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				remainingPhraseGenerations: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// 残り回数が0の場合はエラーを返す
		if (user.remainingPhraseGenerations <= 0) {
			return NextResponse.json(
				{ error: getTranslation(locale, "phrase.messages.dailyLimitExceeded") },
				{ status: 403 },
			);
		}

		// ChatGPT API呼び出し (Structured Outputs使用)
		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json(
				{ error: "OpenAI API key is not configured" },
				{ status: 500 },
			);
		}

		// ランダムに構文パターンとトピックを選択
		const elements = getRandomElements(selectedContext || undefined);

		// ChatGPT APIに送信するプロンプトを構築
		const nativeLanguageName =
			LANGUAGE_NAMES[nativeLanguage as LanguageCode] || nativeLanguage;
		const learningLanguageName =
			LANGUAGE_NAMES[learningLanguage as LanguageCode] || learningLanguage;

		const prompt = getRandomPhraseGenerationPrompt(
			nativeLanguageName,
			learningLanguageName,
			elements,
		);

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4.1-mini",
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.8, // 多様性のため少し高めに設定
				max_tokens: 1500,
				// Structured Outputs使用
				response_format: zodResponseFormat(
					randomPhraseVariationsSchema,
					"random_phrase_variations",
				),
			}),
		});

		if (!response.ok) {
			const errorData = await response.text().catch(() => "Unknown error");
			console.error(
				"[random-generate] OpenAI API error:",
				response.status,
				errorData,
			);
			return NextResponse.json(
				{ error: getTranslation(locale, "phrase.messages.generationFailed") },
				{ status: 500 },
			);
		}

		const data = await response.json();
		const generatedContent = data.choices[0]?.message?.content;

		if (!generatedContent) {
			return NextResponse.json(
				{ error: getTranslation(locale, "phrase.messages.noContentGenerated") },
				{ status: 500 },
			);
		}

		// Structured Outputsなので直接パースできる
		const parsedResponse = randomPhraseVariationsSchema.parse(
			JSON.parse(generatedContent),
		);

		// レスポンス形式を変換
		const variations: PhraseVariation[] = parsedResponse.variations.map(
			(variation) => ({
				original: variation.original,
				translation: variation.translation,
				explanation: variation.explanation,
			}),
		);

		// フレーズ生成が成功した場合、生成回数を減らす
		try {
			// 回数を1減らして更新
			await prisma.user.update({
				where: { id: userId },
				data: {
					remainingPhraseGenerations: user.remainingPhraseGenerations - 1,
					lastPhraseGenerationDate: new Date(),
				},
			});
		} catch (updateError) {
			// エラーがあっても生成は完了しているため、カウント更新エラーを警告レベルで扱う
			console.warn(
				"[random-generate] Failed to update remainingPhraseGenerations:",
				updateError,
			);
		}

		return NextResponse.json({ variations });
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error("[random-generate] Validation error:", error.issues);
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 },
			);
		}

		console.error("[random-generate] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
