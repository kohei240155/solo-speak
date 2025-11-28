import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
	try {
		// mockフォルダからrecorded.webmを読み込む
		const filePath = join(process.cwd(), "mock", "recorded.webm");
		const fileBuffer = await readFile(filePath);

		// webm形式で返す
		return new NextResponse(fileBuffer as unknown as BodyInit, {
			headers: {
				"Content-Type": "audio/webm",
				"Content-Length": fileBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("モック音声データの読み込みエラー:", error);
		return NextResponse.json(
			{ error: "モックデータが見つかりません" },
			{ status: 404 },
		);
	}
}
