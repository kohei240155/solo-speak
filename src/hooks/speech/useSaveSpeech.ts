import { api } from "@/utils/api";
import {
	SaveSpeechRequestBody,
	SaveSpeechResponseData,
} from "@/types/speech";

/**
 * スピーチを保存するAPI関数
 * @param data スピーチデータ
 * @param audioBlob 音声ファイル（オプション）
 * @returns 保存されたスピーチデータ
 */
export const saveSpeech = async (
	data: SaveSpeechRequestBody,
	audioBlob?: Blob | null,
): Promise<SaveSpeechResponseData> => {
	const formData = new FormData();

	// 音声ファイルがある場合は追加
	if (audioBlob) {
		formData.append("audio", audioBlob, "speech.wav");
	}

	// その他のデータをJSON文字列として追加
	formData.append("data", JSON.stringify(data));

	return api.post<SaveSpeechResponseData>("/api/speech/save", formData);
};
