import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const speechStatuses = [
	{
		name: "A",
		description: "スクリプトを見なくても流暢に話すことができる",
	},
	{
		name: "B",
		description: "スクリプトの一部を見れば流暢に話すことができる",
	},
	{
		name: "C",
		description: "スクリプトを見れば流暢に話すことができる",
	},
	{
		name: "D",
		description: "スクリプトを見れば話すことができる",
	},
];

async function main() {
	try {
		console.log("🚀 Seeding Speech Statuses...");

		for (const status of speechStatuses) {
			const existing = await prisma.speechStatus.findFirst({
				where: { name: status.name },
			});

			let result;
			if (existing) {
				result = await prisma.speechStatus.update({
					where: { id: existing.id },
					data: { description: status.description },
				});
			} else {
				result = await prisma.speechStatus.create({
					data: status,
				});
			}
			console.log(`✅ Speech Status "${result.name}" seeded`);
		}

		console.log(
			`🎉 ${speechStatuses.length} speech statuses seeded successfully!`,
		);
	} catch (error) {
		console.error("❌ Error seeding speech statuses:", error);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
