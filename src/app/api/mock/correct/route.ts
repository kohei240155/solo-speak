import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
	try {
		// mockフォルダからcorrect.jsonを読み込む
		const filePath = join(process.cwd(), "mock", "correct.json");
		const fileContent = await readFile(filePath, "utf-8");
		const data = JSON.parse(fileContent);

		return NextResponse.json(data);
	} catch (error) {
		console.error("モック添削データの読み込みエラー:", error);
		return NextResponse.json(
			{ error: "モックデータが見つかりません" },
			{ status: 404 },
		);
	}
}
