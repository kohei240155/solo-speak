import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

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
		console.log("🚀 Seeding Speech Statuses...");

		for (const status of speechStatuses) {
			const existing = await prisma.speechStatus.findFirst({
				where: { name: status.name },
			});

			let result;
			if (existing) {
				result = existing;
				console.log(`✅ Speech Status "${result.name}" already exists`);
			} else {
				result = await prisma.speechStatus.create({
					data: status,
				});
				console.log(`✅ Speech Status "${result.name}" created`);
			}
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
