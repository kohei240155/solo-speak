import { api } from "@/utils/api";

/**
 * フレーズの練習カウントを更新する関数
 */
export async function updatePhraseCount(phraseId: string) {
  try {
    return await api.post(`/api/phrase/${phraseId}/count`);
  } catch (error) {
    throw error;
  }
}

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
 * Speak用のフレーズを取得する関数
 */
export async function getSpeakPhrase(options?: {
  languageCode?: string;
  order?: string;
  prioritizeLowPractice?: string;
}) {
  try {
    const params = new URLSearchParams();
    if (options?.languageCode) params.append("language", options.languageCode);
    if (options?.order) params.append("order", options.order);
    if (options?.prioritizeLowPractice)
      params.append("prioritizeLowPractice", options.prioritizeLowPractice);

    return await api.get(`/api/phrase/speak?${params.toString()}`);
  } catch (error) {
    throw error;
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
