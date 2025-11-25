import { api } from "@/utils/api";
import { SpeakPhraseCountResponse } from "@/types/phrase";
import { ApiErrorResponse, ApiResult } from "@/types/api";

/**
 * フレーズを削除する関数
 */
export async function deletePhrase(phraseId: string) {
	try {
		return await api.delete(`/api/phrase/${phraseId}`);
	} catch (error) {
		throw error;
	}
}

/**
 * フレーズを更新する関数
 */
export async function updatePhrase(
	phraseId: string,
	updates: Record<string, unknown>,
) {
	try {
		return await api.put(`/api/phrase/${phraseId}`, updates);
	} catch (error) {
		throw error;
	}
}

/**
 * ユーザーの全フレーズのsession_spokenをfalseにリセットする関数
 */
export async function resetSessionSpoken() {
	try {
		return await api.post("/api/phrases/reset-session");
	} catch (error) {
		throw error;
	}
}

/**
 * ユーザーの全フレーズのdailySpeakCountをリセットする関数（UTC基準での日付変更時のみ）
 */
export async function resetDailySpeakCount() {
	try {
		return await api.post("/api/user/reset-daily-speak-count");
	} catch (error) {
		throw error;
	}
}

/**
 * Speak用フレーズの数を取得（型安全版）
 */
export async function getSpeakPhraseCount(
	languageCode: string,
	options?: {
		excludeIfSpeakCountGTE?: number;
		excludeTodayPracticed?: boolean;
	},
): Promise<ApiResult<SpeakPhraseCountResponse>> {
	try {
		const params = new URLSearchParams({ language: languageCode });

		if (options?.excludeIfSpeakCountGTE !== undefined) {
			params.append(
				"excludeIfSpeakCountGTE",
				options.excludeIfSpeakCountGTE.toString(),
			);
		}
		if (options?.excludeTodayPracticed) {
			params.append("excludeTodayPracticed", "true");
		}

		const response = await api.get(
			`/api/phrase/speak/count?${params.toString()}`,
		);
		// レスポンスが直接SpeakPhraseCountResponseの形式の場合
		if (response && typeof response === "object" && "success" in response) {
			return response as SpeakPhraseCountResponse;
		}
		// レスポンスがdata プロパティにラップされている場合
		if (response && typeof response === "object" && "data" in response) {
			return (response as { data: SpeakPhraseCountResponse }).data;
		}
		// 予期しない形式の場合
		return { error: "Invalid response format" } as ApiErrorResponse;
	} catch (error: unknown) {
		if (
			error &&
			typeof error === "object" &&
			"response" in error &&
			error.response
		) {
			return (error.response as { data: ApiErrorResponse }).data;
		}
		return { error: "Network error" } as ApiErrorResponse;
	}
}

/**
 * ユーザー設定を取得する関数
 */
export async function getUserSettings() {
	try {
		return await api.get("/api/user/settings");
	} catch (error) {
		throw error;
	}
}

/**
 * 言語リストを取得する関数
 */
export async function getLanguages() {
	try {
		return await api.get("/api/languages");
	} catch (error) {
		throw error;
	}
}

/**
 * レスポンスがエラーかどうかをチェックする型ガード
 */
export function isApiError<T>(
	response: ApiResult<T>,
): response is ApiErrorResponse {
	return (
		typeof response === "object" && response !== null && "error" in response
	);
}

/**
 * レスポンスが成功かどうかをチェックする型ガード
 */
export function isApiSuccess<T>(response: ApiResult<T>): response is T {
	return !isApiError(response);
}
