import { api } from "@/utils/api";
import { SaveSpeechRequestBody, SaveSpeechResponseData } from "@/types/speech";

/**
 * スピーチを保存するAPI関数
 * @param data スピーチデータ
 * @returns 保存されたスピーチデータ
 */
export const saveSpeech = async (
	data: SaveSpeechRequestBody,
): Promise<SaveSpeechResponseData> => {
	return api.post<SaveSpeechResponseData>("/api/speech/save", data);
};
