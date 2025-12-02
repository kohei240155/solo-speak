import { createServerSupabaseClient } from "@/utils/supabase-server";

/**
 * Supabase Storageに音声ファイルをアップロードする
 * @param userId ユーザーID
 * @param speechId スピーチID
 * @param audioBlob 音声ファイルのBlob
 * @returns アップロードされたファイルのパス
 */
export async function uploadSpeechAudio(
	userId: string,
	speechId: string,
	audioBlob: Blob,
): Promise<string> {
	const supabase = createServerSupabaseClient();

	// Blobのタイプから拡張子を決定
	const contentType = audioBlob.type || "audio/wav";
	let extension = "wav";

	if (contentType.includes("mp4") || contentType.includes("m4a")) {
		extension = "m4a";
	} else if (contentType.includes("wav")) {
		extension = "wav";
	} else if (contentType.includes("ogg")) {
		extension = "ogg";
	} else if (contentType.includes("webm")) {
		// WebMの場合もwavとして扱う（サーバー側で変換済み）
		extension = "wav";
	}

	const filePath = `${userId}/${speechId}/audio.${extension}`;

	const { data, error } = await supabase.storage
		.from("speeches")
		.upload(filePath, audioBlob, {
			contentType,
			upsert: true, // 既存ファイルを上書き
		});

	if (error) {
		throw new Error(`Failed to upload audio: ${error.message}`);
	}

	return data.path;
}

/**
 * Supabase Storageから音声ファイルの署名付きURLを取得する
 * @param filePath ファイルパス
 * @param expiresIn URL有効期限（秒）デフォルト1時間
 * @returns 署名付きURL
 */
export async function getSpeechAudioSignedUrl(
	filePath: string,
	expiresIn = 3600,
): Promise<string> {
	const supabase = createServerSupabaseClient();

	const { data, error } = await supabase.storage
		.from("speeches")
		.createSignedUrl(filePath, expiresIn);

	if (error) {
		throw new Error(`Failed to get signed URL: ${error.message}`);
	}

	return data.signedUrl;
}

/**
 * Supabase Storageから音声ファイルを削除する
 * @param filePath ファイルパス
 */
export async function deleteSpeechAudio(filePath: string): Promise<void> {
	const supabase = createServerSupabaseClient();

	const { error } = await supabase.storage.from("speeches").remove([filePath]);

	if (error) {
		throw new Error(`Failed to delete audio: ${error.message}`);
	}
}
