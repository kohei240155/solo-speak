/**
 * テキストの一致度判定ユーティリティ
 * Practice機能で発話テキストと正解テキストの比較に使用
 */

/**
 * テキストを正規化する
 * - 小文字に変換
 * - 句読点を削除
 * - 余分な空白を正規化
 */
export function normalizeText(text: string): string {
	return text
		.toLowerCase()
		// 多言語句読点を削除（ASCII、日本語、中国語、韓国語、タイ語、欧州言語、全角記号）
		.replace(/[.,!?;:'"()[\]{}。、！？「」『』【】（）：；．，·¿¡«»・ฯ]/g, "")
		.replace(/['''""]/g, "") // 引用符を削除
		.replace(/\s+/g, " ") // 連続する空白を1つに
		.trim();
}

/**
 * Levenshtein距離を計算する
 * 2つの文字列間の編集距離（挿入、削除、置換の最小回数）を返す
 */
function levenshteinDistance(str1: string, str2: string): number {
	const m = str1.length;
	const n = str2.length;

	// 空文字列のケース
	if (m === 0) return n;
	if (n === 0) return m;

	// 動的計画法用の2次元配列
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	// 初期化
	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	// 動的計画法で距離を計算
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1, // 削除
				dp[i][j - 1] + 1, // 挿入
				dp[i - 1][j - 1] + cost // 置換
			);
		}
	}

	return dp[m][n];
}

/**
 * 2つのテキスト間の一致度を計算する
 * @param text1 - 比較元テキスト（発話テキスト）
 * @param text2 - 比較先テキスト（正解テキスト）
 * @returns 一致度（0.0〜1.0）
 */
export function calculateSimilarity(text1: string, text2: string): number {
	// テキストを正規化
	const normalized1 = normalizeText(text1);
	const normalized2 = normalizeText(text2);

	// 両方空文字列の場合は完全一致
	if (normalized1 === "" && normalized2 === "") {
		return 1.0;
	}

	// 片方が空文字列の場合は完全不一致
	if (normalized1 === "" || normalized2 === "") {
		return 0.0;
	}

	// 完全一致の場合
	if (normalized1 === normalized2) {
		return 1.0;
	}

	// Levenshtein距離を計算
	const distance = levenshteinDistance(normalized1, normalized2);

	// 最大長を基準に一致度を計算
	const maxLength = Math.max(normalized1.length, normalized2.length);

	// 一致度 = 1 - (距離 / 最大長)
	const similarity = 1 - distance / maxLength;

	// 0.0〜1.0の範囲に収める
	return Math.max(0, Math.min(1, similarity));
}
