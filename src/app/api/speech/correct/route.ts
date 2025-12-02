import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/utils/api-helpers";
import { getSpeechCorrectionPrompt } from "@/prompts/speechCorrection";
import { zodResponseFormat } from "openai/helpers/zod";
import { prisma } from "@/utils/prisma";

// Vercelでの最大実行時間を90秒に設定（Pro/Enterpriseプラン必須）
export const maxDuration = 90;

const correctSpeechSchema = z.object({
	title: z.string().min(1).max(50),
	speechPlanItems: z.array(z.string().max(100)).min(1).max(5),
	transcribedText: z.string().min(1),
	learningLanguage: z.string().min(1),
	nativeLanguage: z.string().min(1),
});

// Structured Outputs用のレスポンススキーマ
const speechCorrectionResponseSchema = z.object({
	sentences: z
		.array(
			z.object({
				learningLanguage: z
					.string()
					.describe("添削後の学習言語での文（文単位）"),
				nativeLanguage: z.string().describe("添削後の母国語での翻訳（文単位）"),
			}),
		)
		.describe("添削後の文章を学習言語と母国語のペアで返す"),
	feedback: z
		.array(
			z.object({
				category: z
					.string()
					.describe(
						"フィードバックのカテゴリ（例: Grammar, Vocabulary, Expression）母国語で記述",
					),
				content: z.string().describe("具体的な改善点の内容（母国語で記述）"),
			}),
		)
		.max(3)
		.describe("改善点のフィードバック（最大3項目、母国語で記述）"),
});

/**
 * スピーチ添削APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns SpeechCorrectionResponse - 添削結果
 */
export async function POST(request: NextRequest) {
	try {
		// 認証チェック
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		const userId = authResult.user.id;

		// ユーザー情報を取得して残回数を確認
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				remainingSpeechCount: true,
			},
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// 残回数チェック
		if (user.remainingSpeechCount <= 0) {
			return NextResponse.json(
				{ error: "No remaining speech count available" },
				{ status: 403 },
			);
		}

		// リクエストボディのバリデーション
		const body = await request.json();
		const {
			title,
			speechPlanItems,
			transcribedText,
			learningLanguage,
			nativeLanguage,
		} = correctSpeechSchema.parse(body);

		// OpenAI API Keyの確認
		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json(
				{ error: "OpenAI API key is not configured" },
				{ status: 500 },
			);
		}

		// プロンプト生成
		const prompt = getSpeechCorrectionPrompt(
			title,
			speechPlanItems,
			transcribedText,
			learningLanguage,
			nativeLanguage,
		);

		// ChatGPT API呼び出し (Structured Outputs使用)
		// Vercelのタイムアウト対策として80秒のタイムアウトを設定
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 80000);

		let response;
		try {
			response = await fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					model: "gpt-5-mini",
					messages: [
						{
							role: "user",
							content: prompt,
						},
					],
					max_completion_tokens: 10000,
					// Structured Outputs使用
					response_format: zodResponseFormat(
						speechCorrectionResponseSchema,
						"speech_correction",
					),
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json();
				console.error("ChatGPT API error:", errorData);
				return NextResponse.json(
					{ error: "Speech correction failed" },
					{ status: 500 },
				);
			}
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === "AbortError") {
				console.error("OpenAI API timeout");
				return NextResponse.json(
					{ error: "Speech correction timed out. Please try again." },
					{ status: 504 },
				);
			}
			throw error;
		}

		const data = await response.json();
		const generatedContent = data.choices[0]?.message?.content;

		if (!generatedContent) {
			return NextResponse.json(
				{ error: "No content generated" },
				{ status: 500 },
			);
		}

		// Structured Outputsなので直接パースできる
		const result = speechCorrectionResponseSchema.parse(
			JSON.parse(generatedContent),
		);

		// 添削成功時に残回数を減らす
		await prisma.user.update({
			where: { id: userId },
			data: {
				remainingSpeechCount: {
					decrement: 1,
				},
			},
		});

		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 },
			);
		}

		console.error("Speech correction error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
