/**
 * フレーズレベル関連のユーティリティ関数
 */

// 正解数からフレーズレベルのスコアを取得する関数（大きい順に判定）
export function getPhraseLevelScoreByCorrectAnswers(
	correctAnswers: number,
): number {
	// 閾値を大きい順に定義（スコア値と対応）
	const thresholds = [30, 20, 10, 5, 3, 1, 0];

	// 大きい順から判定していき、回数に満たなかったら1つ下のレベルへ
	for (const threshold of thresholds) {
		if (correctAnswers >= threshold) {
			return threshold;
		}
	}

	return 0; // 最低レベル
}

// 正解数からフレーズレベルの色を取得する関数
export function getPhraseLevelColorByCorrectAnswers(
	correctAnswers: number,
): string {
	const score = getPhraseLevelScoreByCorrectAnswers(correctAnswers);

	const colorMap: Record<number, string> = {
		0: "#D9D9D9", // Level 1: 正解数 = 0
		1: "#BFBFBF", // Level 2: 正解数 >= 1
		3: "#A6A6A6", // Level 3: 正解数 >= 3
		5: "#8C8C8C", // Level 4: 正解数 >= 5
		10: "#737373", // Level 5: 正解数 >= 10
		20: "#595959", // Level 6: 正解数 >= 20
		30: "#404040", // Level 7: 正解数 >= 30
	};

	return colorMap[score] || "#D9D9D9";
}

// 正解数からフレーズレベルの名前を取得する関数
export function getPhraseLevelNameByCorrectAnswers(
	correctAnswers: number,
): string {
	const score = getPhraseLevelScoreByCorrectAnswers(correctAnswers);

	const nameMap: Record<number, string> = {
		0: "Level 1", // 正解数 = 0
		1: "Level 2", // 正解数 >= 1
		3: "Level 3", // 正解数 >= 3
		5: "Level 4", // 正解数 >= 5
		10: "Level 5", // 正解数 >= 10
		20: "Level 6", // 正解数 >= 20
		30: "Level 7", // 正解数 >= 30
	};

	return nameMap[score] || "Level 1";
}
