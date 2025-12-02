import { PrismaClient } from "../src/generated/prisma";
import { LANGUAGE_CODES, LANGUAGE_NAMES } from "../src/constants/languages";

const prisma = new PrismaClient();

const languages = [
	// 主要国際言語
	{
		name: LANGUAGE_NAMES[LANGUAGE_CODES.ENGLISH],
		code: LANGUAGE_CODES.ENGLISH,
	},
	{
		name: LANGUAGE_NAMES[LANGUAGE_CODES.CHINESE],
		code: LANGUAGE_CODES.CHINESE,
	},
	{ name: LANGUAGE_NAMES[LANGUAGE_CODES.HINDI], code: LANGUAGE_CODES.HINDI },
	{
		name: LANGUAGE_NAMES[LANGUAGE_CODES.SPANISH],
		code: LANGUAGE_CODES.SPANISH,
	},
	{ name: LANGUAGE_NAMES[LANGUAGE_CODES.FRENCH], code: LANGUAGE_CODES.FRENCH },
	{
		name: LANGUAGE_NAMES[LANGUAGE_CODES.PORTUGUESE],
		code: LANGUAGE_CODES.PORTUGUESE,
	},
	{
		name: LANGUAGE_NAMES[LANGUAGE_CODES.JAPANESE],
		code: LANGUAGE_CODES.JAPANESE,
	},
	{ name: LANGUAGE_NAMES[LANGUAGE_CODES.GERMAN], code: LANGUAGE_CODES.GERMAN },
	{ name: LANGUAGE_NAMES[LANGUAGE_CODES.KOREAN], code: LANGUAGE_CODES.KOREAN },
	{
		name: LANGUAGE_NAMES[LANGUAGE_CODES.ITALIAN],
		code: LANGUAGE_CODES.ITALIAN,
	},
	{ name: LANGUAGE_NAMES[LANGUAGE_CODES.THAI], code: LANGUAGE_CODES.THAI },
	{ name: LANGUAGE_NAMES[LANGUAGE_CODES.DUTCH], code: LANGUAGE_CODES.DUTCH },
	{ name: LANGUAGE_NAMES[LANGUAGE_CODES.DANISH], code: LANGUAGE_CODES.DANISH },
];

const phraseLevels = [
	{ name: "Lv1", score: 0, color: "#D9D9D9" },
	{ name: "Lv2", score: 1, color: "#BFBFBF" },
	{ name: "Lv3", score: 3, color: "#A6A6A6" },
	{ name: "Lv4", score: 6, color: "#8C8C8C" },
	{ name: "Lv5", score: 10, color: "#737373" },
	{ name: "Lv6", score: 15, color: "#595959" },
	{ name: "Lv7", score: 21, color: "#404040" },
];

const speechStatuses = [
	{
		name: "A",
	},
	{
		name: "B",
	},
	{
		name: "C",
	},
	{
		name: "D",
	},
];

async function main() {
	try {
		console.log("🚀 Seeding database...");

		// 言語データの投入
		console.log("📝 Seeding languages...");
		for (const lang of languages) {
			await prisma.language.upsert({
				where: { code: lang.code },
				update: {},
				create: lang,
			});
		}
		console.log(`✅ ${languages.length} languages seeded`);

		// フレーズレベルデータの投入
		console.log("📝 Seeding phrase levels...");
		for (const level of phraseLevels) {
			const existing = await prisma.phraseLevel.findFirst({
				where: { name: level.name },
			});

			if (existing) {
				await prisma.phraseLevel.update({
					where: { id: existing.id },
					data: { score: level.score, color: level.color },
				});
			} else {
				await prisma.phraseLevel.create({
					data: level,
				});
			}
		}
		console.log(`✅ ${phraseLevels.length} phrase levels seeded`);

		// スピーチステータスデータの投入
		console.log("📝 Seeding speech statuses...");
		for (const status of speechStatuses) {
			const existing = await prisma.speechStatus.findFirst({
				where: { name: status.name },
			});

			if (!existing) {
				await prisma.speechStatus.create({
					data: status,
				});
			}
		}
		console.log(`✅ ${speechStatuses.length} speech statuses seeded`);

		console.log("🎉 Database seeding completed successfully!");
	} catch (error) {
		console.error("❌ Error seeding database:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
