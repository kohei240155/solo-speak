/**
 * テキスト差分計算ユーティリティ
 * Practice機能で発話テキストと正解テキストの差分表示に使用
 */

import { normalizeText } from "./similarity";

// 差分結果の型（practice.tsからも再エクスポート）
export interface DiffResult {
	type: "equal" | "insert" | "delete";
	value: string;
}

// 文字単位で処理する言語コードのセット（スペースで単語が区切られない言語）
const CHARACTER_BASED_LANGUAGES = new Set(["ja", "zh", "th"]);

/**
 * 言語コードが文字単位処理かどうか判定
 * @param languageCode - 言語コード（例: "ja", "en"）
 * @returns 文字単位で処理すべきならtrue
 */
function isCharacterBasedLanguage(languageCode?: string): boolean {
	if (!languageCode) return true; // デフォルトは文字単位（後方互換性）
	return CHARACTER_BASED_LANGUAGES.has(languageCode.toLowerCase());
}

/**
 * 2つのテキスト間の差分を計算する
 * 言語に応じて文字単位または単語単位でLCS（最長共通部分列）を計算
 * - 日本語・中国語・タイ語：文字単位（スペースで単語が区切られない）
 * - 英語・韓国語・欧州言語等：単語単位（スペースで単語が区切られる）
 * @param transcript - 発話テキスト（認識されたテキスト）
 * @param expected - 正解テキスト
 * @param languageCode - 言語コード（オプショナル、未指定時は文字単位）
 * @returns 差分結果の配列
 */
export function calculateDiff(
	transcript: string,
	expected: string,
	languageCode?: string
): DiffResult[] {
	// テキストを正規化（比較用）
	const normalizedTranscript = normalizeText(transcript);
	const normalizedExpected = normalizeText(expected);

	// 両方空の場合
	if (normalizedTranscript === "" && normalizedExpected === "") {
		return [];
	}

	// 発話が空の場合、正解テキスト全体がdelete（元の原文を使用）
	if (normalizedTranscript === "") {
		return [{ type: "delete", value: expected.trim() }];
	}

	// 正解が空の場合、発話テキスト全体がinsert
	if (normalizedExpected === "") {
		return [{ type: "insert", value: transcript.trim() }];
	}

	// 完全一致の場合（元の原文を使用）
	if (normalizedTranscript === normalizedExpected) {
		return [{ type: "equal", value: expected.trim() }];
	}

	// 言語に応じて処理を分岐
	if (isCharacterBasedLanguage(languageCode)) {
		// 日本語・中国語・タイ語：文字単位
		const diff = computeCharDiff(normalizedTranscript, normalizedExpected);
		return mergeDiffResults(diff);
	} else {
		// 英語・韓国語・欧州言語：単語単位
		const diff = computeWordDiff(normalizedTranscript, normalizedExpected);
		return mergeWordDiffResults(diff);
	}
}

/**
 * 文字単位でLCS（最長共通部分列）を計算して差分を返す
 * @param transcript - 正規化された発話テキスト
 * @param expected - 正規化された正解テキスト
 */
function computeCharDiff(transcript: string, expected: string): DiffResult[] {
	const m = transcript.length;
	const n = expected.length;

	// LCS長を計算するためのDP表
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (transcript[i - 1] === expected[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// バックトラックして差分を構築
	const result: DiffResult[] = [];
	let i = m;
	let j = n;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && transcript[i - 1] === expected[j - 1]) {
			// 一致
			result.unshift({ type: "equal", value: expected[j - 1] });
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			// expectedにあってtranscriptにない（delete）
			result.unshift({ type: "delete", value: expected[j - 1] });
			j--;
		} else if (i > 0) {
			// transcriptにあってexpectedにない（insert）
			result.unshift({ type: "insert", value: transcript[i - 1] });
			i--;
		}
	}

	return result;
}

/**
 * 連続する同じタイプの差分をマージ（文字単位用）
 */
function mergeDiffResults(diff: DiffResult[]): DiffResult[] {
	if (diff.length === 0) return [];

	const merged: DiffResult[] = [];
	let current: DiffResult = { ...diff[0] };

	for (let i = 1; i < diff.length; i++) {
		if (diff[i].type === current.type) {
			// 同じタイプなら文字を連結（文字単位なのでスペースなし）
			current.value += diff[i].value;
		} else {
			// 異なるタイプなら現在のものを追加して次へ
			merged.push(current);
			current = { ...diff[i] };
		}
	}

	// 最後の要素を追加
	merged.push(current);

	return merged;
}

/**
 * 単語単位でLCS（最長共通部分列）を計算して差分を返す（英語等向け）
 * @param transcript - 正規化された発話テキスト
 * @param expected - 正規化された正解テキスト
 */
function computeWordDiff(transcript: string, expected: string): DiffResult[] {
	// 空白文字で単語に分割（連続空白も対応）
	const transcriptWords = transcript.split(/\s+/).filter((w) => w.length > 0);
	const expectedWords = expected.split(/\s+/).filter((w) => w.length > 0);

	const m = transcriptWords.length;
	const n = expectedWords.length;

	// LCS長を計算するためのDP表
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (transcriptWords[i - 1] === expectedWords[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// バックトラックして差分を構築
	const result: DiffResult[] = [];
	let i = m;
	let j = n;

	while (i > 0 || j > 0) {
		if (i > 0 && j > 0 && transcriptWords[i - 1] === expectedWords[j - 1]) {
			// 一致
			result.unshift({ type: "equal", value: expectedWords[j - 1] });
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			// expectedにあってtranscriptにない（delete）
			result.unshift({ type: "delete", value: expectedWords[j - 1] });
			j--;
		} else if (i > 0) {
			// transcriptにあってexpectedにない（insert）
			result.unshift({ type: "insert", value: transcriptWords[i - 1] });
			i--;
		}
	}

	return result;
}

/**
 * 連続する同じタイプの差分をマージ（単語単位用、スペース区切りで結合）
 */
function mergeWordDiffResults(diff: DiffResult[]): DiffResult[] {
	if (diff.length === 0) return [];

	const merged: DiffResult[] = [];
	let current: DiffResult = { ...diff[0] };

	for (let i = 1; i < diff.length; i++) {
		if (diff[i].type === current.type) {
			// 同じタイプなら単語をスペースで連結
			current.value += " " + diff[i].value;
		} else {
			// 異なるタイプなら現在のものを追加して次へ
			merged.push(current);
			current = { ...diff[i] };
		}
	}

	// 最後の要素を追加
	merged.push(current);

	// 各要素（最後を除く）の末尾にスペースを追加して単語間を区切る
	for (let i = 0; i < merged.length - 1; i++) {
		merged[i].value += " ";
	}

	return merged;
}
