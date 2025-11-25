// API関連のhooksをエクスポート
export * from "./useApi";
export * from "./useSWRApi";

// 型安全なAPI関数を再エクスポート（明示的に）
export { getSpeakPhraseCount, isApiError, isApiSuccess } from "./useApi";
