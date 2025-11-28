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
	const filePath = `${userId}/${speechId}/audio.wav`;

	const { data, error } = await supabase.storage
		.from("speeches")
		.upload(filePath, audioBlob, {
			contentType: "audio/wav",
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
