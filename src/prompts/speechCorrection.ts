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
あなたは${learningLanguage}の会話コーチです。 私は${learningLanguage}を学習しており、出来事や自分の考えを${learningLanguage}でうまく説明できるようになりたいと思っています。 そのために「独り言」の練習をしています。
以下に私が話したい内容を箇条書きで示します。 その後、実際に私が話した${learningLanguage}の文章を提供します。

あなたのタスクは次の通りです：
1. 一般的で自然な会話表現を使い、私の話した${learningLanguage}を添削・改善してください。
2. 書き言葉ではなく、自然で話しやすい「口語表現」にしてください。
3. I'm / it's / that's / I'll などの短縮形を積極的に使用してください。
4. 文は短めに区切り、スピーキングに適したリズムで自然に読める文に整えてください。
5. 必要に応じて、口語的な語彙（例: going to → gonna, want to → wanna など）に調整してください。（不自然にならない範囲で）
6. もともと正しく言えている部分は変更しないでください。
7. 一部アドリブ（即興）で話した箇所があるため、全体の流れが自然になるよう調整してください。
8. 添削が終わったら、修正後の全文を${learningLanguage}と${nativeLanguage}でそれぞれ出力してください。
9. 最後に、どの点を改善すればさらに良くなるかを必ず${nativeLanguage}で最大5項目具体的にフィードバックしてください。

# 注意事項
・文章をダッシュで繋げないでください
・出力時に必ずピリオドなどの一文単位でセンテンスを分割してください
・フィードバックのタイトルは英語で記述してください（例: Grammar, Vocabulary, Expression）

# 話したいこと
タイトル: ${title}

${speechPlanText}

# 実際に話した${learningLanguage}の文章
${transcribedText}`;
};
