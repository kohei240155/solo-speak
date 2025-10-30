import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function cleanupPhraseLevels() {
	try {
		console.log("🧹 フレーズレベルのクリーンアップを開始します...\n");

		// 現在のフレーズレベルを全て取得
		const allLevels = await prisma.phraseLevel.findMany({
			where: { deletedAt: null },
			orderBy: { score: "asc" },
		});

		console.log(`現在のフレーズレベル数: ${allLevels.length}`);
		allLevels.forEach((level) => {
			console.log(
				`  - ${level.name} (score: ${level.score}, color: ${level.color})`,
			);
		});

		// 必要なスコアのリスト（0, 1, 3, 5, 10, 20, 30）
		const targetScores = [0, 1, 3, 5, 10, 20, 30];

		// 不要なレベルを特定
		const levelsToDelete = allLevels.filter(
			(level) => !targetScores.includes(level.score),
		);

		if (levelsToDelete.length > 0) {
			console.log(`\n削除対象のレベル: ${levelsToDelete.length}件`);
			levelsToDelete.forEach((level) => {
				console.log(`  - ${level.name} (score: ${level.score})`);
			});

			// フレーズが紐づいているレベルがあるかチェック
			for (const level of levelsToDelete) {
				const phraseCount = await prisma.phrase.count({
					where: {
						phraseLevelId: level.id,
						deletedAt: null,
					},
				});

				if (phraseCount > 0) {
					console.log(
						`⚠️  ${level.name} (score: ${level.score}) には ${phraseCount}件のフレーズが紐づいています`,
					);

					// 最も近いスコアのレベルを見つけて移行
					const nearestScore = targetScores.reduce((prev, curr) =>
						Math.abs(curr - level.score) < Math.abs(prev - level.score)
							? curr
							: prev,
					);

					const nearestLevel = allLevels.find(
						(l) => l.score === nearestScore && targetScores.includes(l.score),
					);

					if (nearestLevel) {
						console.log(
							`  → ${nearestLevel.name} (score: ${nearestLevel.score}) に移行します`,
						);

						await prisma.phrase.updateMany({
							where: {
								phraseLevelId: level.id,
								deletedAt: null,
							},
							data: {
								phraseLevelId: nearestLevel.id,
								updatedAt: new Date(),
							},
						});

						console.log(`  ✅ ${phraseCount}件のフレーズを移行しました`);
					}
				}
			}

			// 不要なレベルを削除
			for (const level of levelsToDelete) {
				await prisma.phraseLevel.delete({
					where: { id: level.id },
				});
				console.log(`🗑️  削除: ${level.name} (score: ${level.score})`);
			}

			console.log(`\n📊 削除完了: ${levelsToDelete.length}件`);
		} else {
			console.log("\n削除対象のレベルはありません。");
		}

		// 最終確認
		const finalLevels = await prisma.phraseLevel.findMany({
			where: { deletedAt: null },
			orderBy: { score: "asc" },
		});

		console.log(
			`\n✅ クリーンアップ完了！最終的なフレーズレベル: ${finalLevels.length}件`,
		);
		finalLevels.forEach((level, index) => {
			console.log(
				`  ${index + 1}. ${level.name} - Score: ${level.score} - Color: ${level.color || "なし"}`,
			);
		});
	} catch (error) {
		console.error("❌ エラーが発生しました:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

// メイン実行
if (require.main === module) {
	cleanupPhraseLevels()
		.then(() => {
			console.log("\n🎉 フレーズレベルのクリーンアップが正常に完了しました！");
			process.exit(0);
		})
		.catch((error) => {
			console.error("\n💥 クリーンアップ中にエラーが発生しました:", error);
			process.exit(1);
		});
}
