import { PrismaClient } from "../src/generated/prisma";
import { getPhraseLevelScoreByCorrectAnswers } from "../src/utils/phrase-level-utils";

const prisma = new PrismaClient();

async function updateExistingPhraseLevels() {
	try {
		console.log("🔄 既存フレーズのレベル更新を開始します...\n");

		// 全てのフレーズを取得
		const phrases = await prisma.phrase.findMany({
			where: { deletedAt: null },
			include: {
				phraseLevel: true,
			},
		});

		console.log(`対象フレーズ数: ${phrases.length}件`);

		if (phrases.length === 0) {
			console.log("更新対象のフレーズがありません。");
			return;
		}

		// 全てのフレーズレベルを取得
		const phraseLevels = await prisma.phraseLevel.findMany({
			where: { deletedAt: null },
			orderBy: { score: "asc" },
		});

		console.log(`利用可能なフレーズレベル: ${phraseLevels.length}件`);

		if (phraseLevels.length === 0) {
			console.log(
				"❌ フレーズレベルが見つかりません。先にsetup-phrase-levels.tsを実行してください。",
			);
			return;
		}

		// フレーズレベルをスコアでマップ
		const levelMap = new Map<number, string>();
		phraseLevels.forEach((level) => {
			levelMap.set(level.score, level.id);
		});

		console.log("\n📊 フレーズレベル一覧:");
		phraseLevels.forEach((level) => {
			console.log(`  Score ${level.score}: ${level.name} - ${level.color}`);
		});

		// 各フレーズを処理
		let updatedCount = 0;
		let noChangeCount = 0;

		console.log("\n🔄 フレーズの更新を開始...");

		for (const phrase of phrases) {
			const correctAnswers = phrase.correctQuizCount;
			const expectedScore = getPhraseLevelScoreByCorrectAnswers(correctAnswers);
			const expectedLevelId = levelMap.get(expectedScore);

			if (!expectedLevelId) {
				console.log(
					`⚠️  フレーズ ${phrase.id}: 正解数 ${correctAnswers} に対するレベルが見つかりません`,
				);
				continue;
			}

			// 現在のレベルと期待されるレベルを比較
			if (phrase.phraseLevelId !== expectedLevelId) {
				// レベルを更新
				await prisma.phrase.update({
					where: { id: phrase.id },
					data: {
						phraseLevelId: expectedLevelId,
						updatedAt: new Date(),
					},
				});

				const oldLevel = phraseLevels.find(
					(l) => l.id === phrase.phraseLevelId,
				);
				const newLevel = phraseLevels.find((l) => l.id === expectedLevelId);

				console.log(
					`📝 更新: ${phrase.original.substring(0, 30)}... | ` +
						`正解数: ${correctAnswers} | ` +
						`${oldLevel?.name || "不明"} → ${newLevel?.name || "不明"}`,
				);
				updatedCount++;
			} else {
				noChangeCount++;
			}
		}

		console.log(`\n📊 更新完了統計:`);
		console.log(`   更新されたフレーズ: ${updatedCount}件`);
		console.log(`   変更なし: ${noChangeCount}件`);
		console.log(`   合計処理: ${updatedCount + noChangeCount}件`);

		// 更新後の統計を表示
		console.log("\n📈 更新後のレベル別フレーズ数:");
		for (const level of phraseLevels) {
			const count = await prisma.phrase.count({
				where: {
					deletedAt: null,
					phraseLevelId: level.id,
				},
			});
			console.log(`   ${level.name}: ${count}件`);
		}
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// メイン実行
if (require.main === module) {
	updateExistingPhraseLevels()
		.then(() => {
			console.log("\n🎉 既存フレーズのレベル更新が正常に完了しました！");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n💥 更新中にエラーが発生しました:", error);
			process.exit(1);
		});
}
