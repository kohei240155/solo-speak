/**
 * スピーチ添削用のプロンプトテンプレート
 * @param title - スピーチのタイトル
 * @param speechPlanItems - 話したい内容の箇条書き
 * @param transcribedText - 実際に話した文章
 * @param learningLanguage - 学習言語（話した言語）
 * @param nativeLanguage - 母国語
 * @returns 完成したプロンプト文字列
 */
export const getSpeechCorrectionPrompt = (
	title: string,
	speechPlanItems: string[],
	transcribedText: string,
	learningLanguage: string,
	nativeLanguage: string,
): string => {
	const speechPlanText = speechPlanItems
		.map((item, index) => `${index + 1}. ${item}`)
		.join("\n");

	return `# 指示
あなたは${learningLanguage}の会話コーチです。私は${learningLanguage}で出来事や考えを自然に話せるよう練習しています。
以下の箇条書きは話したい内容で、その後に実際に話した${learningLanguage}を記載します。

あなたのタスク：
1. 内容を保ったまま、自然で話しやすい「口語表現」に添削してください。
2. 短縮形（I'm / it's / that's / I'll など）を積極的に使用してください。
3. 文は短めに区切り、スピーキング向けのリズムにしてください。
4. 不自然でなければ口語的な語彙（gonna, wanna など）も使用可。
5. 正しく言えている部分は変更しないでください。
6. 全体の流れが自然になるよう調整してください。
7. 添削後の全文を${learningLanguage}と${nativeLanguage}で出力してください。
8. 最後に改善ポイントを${nativeLanguage}で最大5つフィードバックしてください。

# 注意事項
・文章をダッシュで繋げないでください。
・出力は必ず一文ずつピリオド単位で区切ってください。
・フィードバックのタイトルは英語にしてください。

# 話したいこと
タイトル: ${title}

${speechPlanText}

# 実際に話した${learningLanguage}の文章
${transcribedText}`;
};
