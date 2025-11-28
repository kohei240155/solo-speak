import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/utils/api-helpers";

/**
 * 音声データをWhisper APIに送信して文字起こしを行うAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト（FormDataで音声データを受け取る）
 * @returns 文字起こし結果
 */
export async function POST(request: NextRequest) {
	try {
		// ユーザー認証
		const authResult = await authenticateRequest(request);
		if ("error" in authResult) {
			return authResult.error;
		}

		// OpenAI API Keyの確認
		if (!process.env.OPENAI_API_KEY) {
			return NextResponse.json(
				{ error: "OpenAI API key is not configured" },
				{ status: 500 },
			);
		}

		// FormDataから音声データ（Blob）を取得
		const formData = await request.formData();
		const audioBlob = formData.get("file") as Blob | null;
		const language = formData.get("language") as string | null; // オプション: 言語コード（例: "ja", "en"）

		if (!audioBlob) {
			return NextResponse.json(
				{ error: "Audio data is required" },
				{ status: 400 },
			);
		}

		// データサイズの検証（25MB制限）
		const maxSize = 25 * 1024 * 1024; // 25MB
		if (audioBlob.size > maxSize) {
			return NextResponse.json(
				{ error: "Audio data size exceeds 25MB limit" },
				{ status: 400 },
			);
		}

		// Whisper APIに送信するFormDataを構築
		const whisperFormData = new FormData();
		whisperFormData.append("file", audioBlob, "recording.webm");
		whisperFormData.append("model", "whisper-1");

		// 言語が指定されている場合は追加
		if (language) {
			whisperFormData.append("language", language);
		}

		// Whisper APIを呼び出し
		const response = await fetch(
			"https://api.openai.com/v1/audio/transcriptions",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				},
				body: whisperFormData,
			},
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			console.error("Whisper API error:", errorData);
			return NextResponse.json(
				{
					error: "Failed to transcribe audio",
					details: errorData,
				},
				{ status: response.status },
			);
		}

		const transcriptionData = await response.json();

		return NextResponse.json({
			text: transcriptionData.text,
			language: transcriptionData.language || language || null,
		});
	} catch (error) {
		console.error("Error in transcribe API:", error);
		return NextResponse.json(
			{
				error: "An error occurred while processing the audio data",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
