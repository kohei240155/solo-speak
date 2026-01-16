import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/utils/api-helpers";
import { getTranslation, getLocaleFromRequest } from "@/utils/api-i18n";
import { zodResponseFormat } from "openai/helpers/zod";
import { prisma } from "@/utils/prisma";
import { getRandomPhraseGenerationPrompt } from "@/prompts/randomPhraseGeneration";
import { LANGUAGE_NAMES, type LanguageCode } from "@/constants/languages";
import type { RandomPhraseVariation } from "@/types/phrase";

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

// 日常会話でよく使われる構文パターン
const EXPRESSION_PATTERNS = [
	// ① 追加・同様
	"〜もまた",
	"〜も同様に",
	"〜だけでなく",
	"〜に加えて",
	"さらに言えば",
	"その上",
	"どちらも",
	"同じように",
	"それに",
	"なお",
	"あわせて",
	"ついでに言うと",
	"それどころか",
	"加えて言うなら",
	"のみならず",
	"同時に",

	// ② 比較・対比
	"〜より",
	"〜ほどではない",
	"〜と比べて",
	"〜とは対照的に",
	"一方で",
	"反対に",
	"〜よりむしろ",
	"〜の方が",
	"どちらかと言えば",
	"必ずしも〜ではない",
	"〜というより",
	"〜に対して",
	"一概には言えないが",
	"〜とは言い切れない",

	// ③ 程度・量
	"できるだけ",
	"可能な限り",
	"少しでも",
	"ある程度",
	"かなり",
	"思った以上に",
	"予想より",
	"ほぼ",
	"徐々に",
	"多少なりとも",
	"そこそこ",
	"意外と",
	"思いのほか",
	"想像以上に",
	"ほとんど〜ない",
	"かろうじて",

	// ④ 時間・タイミング
	"できるだけ早く",
	"すぐに",
	"そのうち",
	"いずれ",
	"〜している間に",
	"〜した直後に",
	"〜する前に",
	"〜してから",
	"今のところ",
	"現時点では",
	"これから先",
	"最終的に",
	"近いうちに",
	"ちょうどその頃",
	"最近は",
	"ここ最近",
	"当時は",
	"今となっては",
	"さっき",
	"あとで",

	// ⑤ 理由・結果
	"〜なので",
	"〜だから",
	"〜のため",
	"その結果",
	"そのため",
	"〜のおかげで",
	"〜のせいで",
	"結果として",
	"〜という背景がある",
	"〜という事情で",
	"それが理由で",
	"その流れで",
	"〜というわけで",

	// ⑥ 目的・意図
	"〜するために",
	"〜ように",
	"〜に備えて",
	"〜を目的として",
	"念のため",

	// ⑦ 条件・仮定
	"もし〜なら",
	"〜の場合",
	"〜次第で",
	"〜さえすれば",
	"〜しない限り",
	"〜であれば",
	"万が一",
	"仮に〜だとしたら",

	// ⑧ 譲歩・逆接
	"〜にもかかわらず",
	"それでも",
	"とはいえ",
	"確かに〜だが",
	"そうは言っても",
	"とはいえね",
	"一応〜だけど",
	"正確には〜が",

	// ⑨ 順序・整理
	"まず",
	"次に",
	"その後",
	"最後に",
	"要するに",
	"つまり",
	"言い換えると",
	"結論から言うと",
	"まとめると",
	"要点だけ言うと",

	// ⑩ 強調・限定
	"特に",
	"とりわけ",
	"少なくとも",
	"せめて",
	"まさに",
	"間違いなく",
	"明らかに",
	"どうしても",
	"あくまで",
	"〜に限って",

	// ⑪ 可能・能力・制限
	"〜できる限り",
	"〜が可能だ",
	"〜せざるを得ない",
	"〜するしかない",
	"〜が難しい",
	"対応可能",
	"現実的ではない",

	// ⑫ 判断・意見
	"〜と思う",
	"〜と考える",
	"個人的には",
	"一般的には",
	"〜のように見える",
	"〜と言える",
	"私の立場としては",

	// ⑬ 会話で超頻出
	"正直言うと",
	"要は",
	"実際のところ",
	"どちらかというと",
	"一応",
	"たまたま",
	"例えば",
	"ちなみに",
	"結局のところ",

	// ⑭ 状況説明・前提共有
	"そもそも",
	"前提として",
	"話を戻すと",
	"状況的には",
	"今の話で言うと",
	"この文脈だと",

	// ⑮ 感情・リアクション
	"正直なところ",
	"ぶっちゃけ",
	"個人的な感覚だと",
	"正直びっくりした",
	"ありがたいことに",
	"残念ながら",
	"困ったことに",

	// ⑯ あいまい・保留
	"場合による",
	"何とも言えない",
	"一概には言えない",
	"なんとも微妙",
	"どちらとも取れる",
	"まだ判断できない",

	// ⑰ 同意・確認・調整
	"たしかに",
	"言われてみれば",
	"その通りで",
	"分かる気がする",
	"そういう意味では",
	"〜という認識で合ってる？",

	// ⑱ 話題転換・つなぎ
	"ところで",
	"話は変わるけど",
	"それはそうと",
	"そういえば",
	"別の観点だと",

	// ⑲ 例示・具体化
	"具体的には",
	"イメージとしては",
	"たとえばだけど",
	"極端な例を出すと",
	"よくあるケースだと",

	// ⑳ 結論・まとめ
	"最終的には",
	"つまりそういうこと",
] as const;

// トピックの定義（シチュエーションが未指定の場合に使用）
const TOPICS = [
	"食事・料理",
	"仕事・キャリア",
	"旅行・移動",
	"趣味・娯楽",
	"家族・人間関係",
	"健康・体調",
	"天気・季節",
	"買い物・お金",
	"時間・予定",
	"友人との会話",
] as const;

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
		const variations: RandomPhraseVariation[] = parsedResponse.variations.map(
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
			return NextResponse.json(
				{ error: "Invalid request data", details: error.issues },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
