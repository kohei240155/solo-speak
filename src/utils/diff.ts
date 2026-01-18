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

/**
 * 2つのテキスト間の差分を計算する
 * @param transcript - 発話テキスト（認識されたテキスト）
 * @param expected - 正解テキスト
 * @returns 差分結果の配列
 */
export function calculateDiff(
	transcript: string,
	expected: string
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

	// 元のテキストから単語を抽出（表示用）
	const originalTranscriptWords = extractWords(transcript);
	const originalExpectedWords = extractWords(expected);

	// 正規化した単語（比較用）
	const normalizedTranscriptWords = normalizedTranscript.split(" ");
	const normalizedExpectedWords = normalizedExpected.split(" ");

	// LCS（最長共通部分列）を使用して差分を計算
	// 比較は正規化版、表示は元の原文
	const diff = computeWordDiff(
		normalizedTranscriptWords,
		normalizedExpectedWords,
		originalTranscriptWords,
		originalExpectedWords
	);

	// 連続する同じタイプの差分をマージ
	return mergeDiffResults(diff);
}

/**
 * テキストから単語を抽出（句読点を除去しつつ元の大文字小文字を保持）
 */
function extractWords(text: string): string[] {
	return text
		.trim()
		.replace(/[.,!?;:'"()[\]{}]/g, "")
		.split(/\s+/)
		.filter((word) => word.length > 0);
}

/**
 * 単語配列間の差分を計算（LCSベース）
 * @param normalizedTranscript - 正規化された発話単語（比較用）
 * @param normalizedExpected - 正規化された正解単語（比較用）
 * @param originalTranscript - 元の発話単語（表示用）
 * @param originalExpected - 元の正解単語（表示用）
 */
function computeWordDiff(
	normalizedTranscript: string[],
	normalizedExpected: string[],
	originalTranscript: string[],
	originalExpected: string[]
): DiffResult[] {
	const m = normalizedTranscript.length;
	const n = normalizedExpected.length;

	// LCS長を計算するためのDP表
	const dp: number[][] = Array(m + 1)
		.fill(null)
		.map(() => Array(n + 1).fill(0));

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (normalizedTranscript[i - 1] === normalizedExpected[j - 1]) {
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
		if (
			i > 0 &&
			j > 0 &&
			normalizedTranscript[i - 1] === normalizedExpected[j - 1]
		) {
			// 一致（正解の元の単語を使用）
			result.unshift({ type: "equal", value: originalExpected[j - 1] });
			i--;
			j--;
		} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
			// expectedにあってtranscriptにない（delete）（正解の元の単語を使用）
			result.unshift({ type: "delete", value: originalExpected[j - 1] });
			j--;
		} else if (i > 0) {
			// transcriptにあってexpectedにない（insert）（発話の元の単語を使用）
			result.unshift({ type: "insert", value: originalTranscript[i - 1] });
			i--;
		}
	}

	return result;
}

/**
 * 連続する同じタイプの差分をマージ
 */
function mergeDiffResults(diff: DiffResult[]): DiffResult[] {
	if (diff.length === 0) return [];

	const merged: DiffResult[] = [];
	let current: DiffResult = { ...diff[0] };

	for (let i = 1; i < diff.length; i++) {
		if (diff[i].type === current.type) {
			// 同じタイプならマージ（スペースで区切る）
			current.value += " " + diff[i].value;
		} else {
			// 異なるタイプなら現在のものを追加して次へ
			// 最後にスペースを追加（次の要素がある場合）
			if (merged.length > 0 || diff[i].type !== current.type) {
				current.value += " ";
			}
			merged.push(current);
			current = { ...diff[i] };
		}
	}

	// 最後の要素を追加
	merged.push(current);

	return merged;
}
