// 型安全なAPI呼び出しの使用例

import { getSpeakPhraseCount, isApiError, isApiSuccess } from "@/hooks/api";

// 使用例1: Speakフレーズ数を取得
export async function handleGetSpeakPhraseCount(languageCode: string) {
	const result = await getSpeakPhraseCount(languageCode, {
		excludeIfSpeakCountGTE: 50,
		excludeTodayPracticed: true,
	});

	if (isApiSuccess(result)) {
		return result.count;
	} else {
		// エラーハンドリング - 型安全にerrorプロパティにアクセス可能
		console.error(result.error);
	}

	return 0;
}

// 使用例2: React Hook での使用
export function useTypeSafeSpeakPhraseCount() {
	const fetchCount = async (languageCode: string) => {
		const result = await getSpeakPhraseCount(languageCode, {
			excludeIfSpeakCountGTE: 50,
			excludeTodayPracticed: true,
		});

		if (isApiError(result)) {
			// エラートーストなどの処理
			throw new Error(result.error);
		}

		// 成功時のレスポンスは完全に型安全
		return result.count;
	};

	return { fetchCount };
}
