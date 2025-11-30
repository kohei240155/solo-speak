import { NextResponse } from "next/server";
import { prisma } from "@/utils/prisma";

/**
 * スピーチステータス一覧取得APIエンドポイント
 * @returns SpeechStatusListResponse - スピーチステータス一覧
 */
export async function GET(): Promise<NextResponse> {
	try {
		const statuses = await prisma.speechStatus.findMany({
			where: {
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				description: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		return NextResponse.json({ statuses }, { status: 200 });
	} catch (error) {
		console.error("Error fetching speech statuses:", error);
		return NextResponse.json(
			{ error: "Failed to fetch speech statuses" },
			{ status: 500 },
		);
	}
}
