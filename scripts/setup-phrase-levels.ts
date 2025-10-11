import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// 画像で指定されたフレーズレベルデータ（スコアは閾値）
const phraseLevelData = [
  {
    name: "Level 1",
    score: 0,
    color: "#D9D9D9", // 正解数 = 0
    description: "正解数 = 0",
  },
  {
    name: "Level 2",
    score: 1,
    color: "#BFBFBF", // 0 < 正解数 <= 1
    description: "0 < 正解数 & 正解数 <= 1",
  },
  {
    name: "Level 3",
    score: 3,
    color: "#A6A6A6", // 1 < 正解数 <= 3
    description: "1 < 正解数 & 正解数 <= 3",
  },
  {
    name: "Level 4",
    score: 5,
    color: "#8C8C8C", // 3 < 正解数 <= 5
    description: "3 < 正解数 & 正解数 <= 5",
  },
  {
    name: "Level 5",
    score: 10,
    color: "#737373", // 5 < 正解数 <= 10
    description: "5 < 正解数 & 正解数 <= 10",
  },
  {
    name: "Level 6",
    score: 20,
    color: "#595959", // 10 < 正解数 <= 20
    description: "10 < 正解数 & 正解数 <= 20",
  },
  {
    name: "Level 7",
    score: 30,
    color: "#404040", // 20 < 正解数 <= 30
    description: "20 < 正解数 & 正解数 <= 30",
  },
];

async function setupPhraseLevels() {
  try {
    console.log("🚀 フレーズレベルのセットアップを開始します...\n");

    // 既存のフレーズレベルを確認
    const existingLevels = await prisma.phraseLevel.findMany({
      where: { deletedAt: null },
      orderBy: { score: "asc" },
    });

    console.log(`現在のフレーズレベル数: ${existingLevels.length}`);
    if (existingLevels.length > 0) {
      console.log("既存のレベル:");
      existingLevels.forEach((level) => {
        console.log(
          `  - ${level.name} (score: ${level.score}, color: ${level.color})`,
        );
      });
      console.log();
    }

    // フレーズレベルデータを更新/作成
    let createdCount = 0;
    let updatedCount = 0;

    for (const levelData of phraseLevelData) {
      // scoreに基づいて既存のレベルを検索
      const existingLevel = existingLevels.find(
        (l) => l.score === levelData.score,
      );

      if (existingLevel) {
        // 既存のレベルを更新
        await prisma.phraseLevel.update({
          where: { id: existingLevel.id },
          data: {
            name: levelData.name,
            color: levelData.color,
            updatedAt: new Date(),
          },
        });
        updatedCount++;
        console.log(
          `📝 更新: ${levelData.name} (score: ${levelData.score}, color: ${levelData.color})`,
        );
      } else {
        // 新規作成
        await prisma.phraseLevel.create({
          data: {
            name: levelData.name,
            score: levelData.score,
            color: levelData.color,
          },
        });
        createdCount++;
        console.log(
          `✨ 新規: ${levelData.name} (score: ${levelData.score}, color: ${levelData.color})`,
        );
      }
    }

    console.log(`\n📊 完了統計:`);
    console.log(`   新規作成: ${createdCount}件`);
    console.log(`   更新: ${updatedCount}件`);

    // 最終確認
    const finalLevels = await prisma.phraseLevel.findMany({
      where: { deletedAt: null },
      orderBy: { score: "asc" },
    });

    console.log(
      `\n✅ セットアップ完了！最終的なフレーズレベル: ${finalLevels.length}件`,
    );
    console.log("フレーズレベル一覧:");
    finalLevels.forEach((level, index) => {
      console.log(
        `  ${index + 1}. ${level.name} - Score: ${level.score} - Color: ${level.color}`,
      );
    });

    // 正解数とレベルの対応表を表示
    console.log("\n📋 正解数とレベルの対応:");
    phraseLevelData.forEach((level) => {
      console.log(`  ${level.name}: ${level.description} - 色: ${level.color}`);
    });
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 正解数からフレーズレベルを取得する関数（大きい順に判定）
export function getPhraseLevelByCorrectAnswers(correctAnswers: number): number {
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

// メイン実行
if (require.main === module) {
  setupPhraseLevels()
    .then(() => {
      console.log("\n🎉 フレーズレベルのセットアップが正常に完了しました！");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 セットアップ中にエラーが発生しました:", error);
      process.exit(1);
    });
}
