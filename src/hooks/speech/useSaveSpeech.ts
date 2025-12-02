import { api } from "@/utils/api";
import { SaveSpeechRequestBody, SaveSpeechResponseData } from "@/types/speech";

/**
 * スピーチを保存するAPI関数
 * @param data スピーチデータ
 * @param audioBlob 音声ファイル（オプション）
 * @param audioMimeType 音声ファイルのMIMEタイプ（オプション）
 * @returns 保存されたスピーチデータ
 */
export const saveSpeech = async (
	data: SaveSpeechRequestBody,
	audioBlob?: Blob | null,
	audioMimeType?: string,
): Promise<SaveSpeechResponseData> => {
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
		formData.append("audio", audioBlob, `speech.${extension}`);
	}

	// その他のデータをJSON文字列として追加
	formData.append("data", JSON.stringify(data));

	return api.post<SaveSpeechResponseData>("/api/speech/save", formData);
};
