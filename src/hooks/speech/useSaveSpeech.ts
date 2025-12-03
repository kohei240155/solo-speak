import { api } from "@/utils/api";
import { SaveSpeechRequestBody, SaveSpeechResponseData } from "@/types/speech";

/**
 * スピーチを保存するAPI関数
 * @param data スピーチデータ
 * @param audioBlob 音声ファイル（オプション）
 * @param audioMimeType 音声ファイルのMIMEタイプ（オプション）
 * @returns 保存されたスピーチデータ（totalSpeechCountを含む）
 */
export const saveSpeech = async (
	data: SaveSpeechRequestBody,
	audioBlob?: Blob | null,
	audioMimeType?: string,
): Promise<SaveSpeechResponseData> => {
	console.log("[useSaveSpeech] Starting save speech process", {
		hasAudio: !!audioBlob,
		audioSize: audioBlob?.size,
		audioMimeType,
	});

	const formData = new FormData();

	// 音声ファイルがある場合は追加
	if (audioBlob) {
		// MIMEタイプから適切な拡張子を決定
		let extension = "webm";
		if (audioMimeType?.includes("mp4")) {
			extension = "mp4";
		} else if (audioMimeType?.includes("aac")) {
			extension = "aac";
		} else if (audioMimeType?.includes("wav")) {
			extension = "wav";
		}
		console.log("[useSaveSpeech] Adding audio to FormData", {
			extension,
			size: audioBlob.size,
			type: audioBlob.type,
			mimeType: audioMimeType,
		});
		formData.append("audio", audioBlob, `speech.${extension}`);
	}

	// その他のデータをJSON文字列として追加
	formData.append("data", JSON.stringify(data));

	console.log("[useSaveSpeech] Sending request to API");
	try {
		const result = await api.post<SaveSpeechResponseData>(
			"/api/speech/save",
			formData,
		);
		console.log("[useSaveSpeech] Save successful", {
			speechId: result.speech.id,
			hasAudioPath: !!result.speech.audioFilePath,
		});

		return result;
	} catch (error) {
		console.error("[useSaveSpeech] Save failed:", error);
		// Re-throw the error with details for UI display
		throw error;
	}
};
