import {
  getPhraseLevelScoreByCorrectAnswers,
  getPhraseLevelColorByCorrectAnswers,
  getPhraseLevelNameByCorrectAnswers,
} from "../src/utils/phrase-level-utils";

// テスト用の正解数配列
const testCases = [0, 1, 2, 3, 4, 5, 9, 10, 15, 20, 25, 30, 35, 50];

console.log("🧪 フレーズレベルロジックのテスト\n");
console.log("正解数 | レベル | スコア | 色");
console.log("-------|--------|--------|----------");

testCases.forEach((correctAnswers) => {
  const score = getPhraseLevelScoreByCorrectAnswers(correctAnswers);
  const levelName = getPhraseLevelNameByCorrectAnswers(correctAnswers);
  const color = getPhraseLevelColorByCorrectAnswers(correctAnswers);

  console.log(
    `${correctAnswers.toString().padStart(6)} | ${levelName.padEnd(6)} | ${score.toString().padStart(6)} | ${color}`,
  );
});

console.log("\n📋 レベル判定ロジック:");
console.log("- 大きい順の閾値: [30, 20, 10, 5, 3, 1, 0]");
console.log("- 正解数が閾値以上なら、そのレベルに判定");
console.log("- 例: 正解数15 → 30未満、20未満、10以上 → Level 5 (score: 10)");

console.log("\n✅ テスト完了！");
