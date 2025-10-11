// SWRキーの管理と型安全性を提供するユーティリティ

export const SWR_KEYS = {
  // ユーザー設定関連
  USER_SETTINGS: "/api/user/settings",

  // 言語関連
  LANGUAGES: "/api/languages",

  // フレーズ関連
  PHRASE_REMAINING: "/api/phrase/remaining",
  PHRASE_LIST: (language: string, page: number) =>
    `/api/phrase?languageCode=${language}&page=${page}&limit=10&minimal=true`,
  PHRASE_INFINITE: (language: string) => (pageIndex: number) =>
    `/api/phrase?languageCode=${language}&page=${pageIndex + 1}&limit=10&minimal=true`,
  PHRASE_SPEAK: (language: string) => `/api/phrase/speak?language=${language}`,
  PHRASE_SPEAK_BY_ID: (id: string) => `/api/phrase/${id}/speak`,
  PHRASE_BY_ID: (id: string) => `/api/phrase/${id}`,

  // シチュエーション関連
  SITUATIONS: "/api/situations",

  // ダッシュボード関連
  DASHBOARD: (language?: string) =>
    language ? `/api/dashboard?language=${language}` : "/api/dashboard",

  // ランキング関連
  RANKING: (type?: string, language?: string, period?: string) => {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (language) params.append("language", language);
    if (period) params.append("period", period);
    return `/api/ranking?${params.toString()}`;
  },
} as const;

// キャッシュ無効化のヘルパー関数
export const SWR_CACHE_HELPERS = {
  // 特定言語のフレーズリストキャッシュを無効化
  invalidatePhrasesByLanguage: (language: string) => (key: unknown) =>
    typeof key === "string" &&
    key.includes("/api/phrase") &&
    key.includes(`languageCode=${language}`),

  // フレーズ関連のすべてのキャッシュを無効化
  invalidateAllPhrases: (key: unknown) =>
    typeof key === "string" && key.includes("/api/phrase"),

  // 特定のフレーズIDのキャッシュを無効化
  invalidatePhraseById: (id: string) => (key: unknown) =>
    typeof key === "string" && key.includes(`/api/phrase/${id}`),
};
