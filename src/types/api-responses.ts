// フロントエンド・バックエンド共通のAPIレスポンス型定義

// ベースレスポンス型
export interface BaseApiResponse {
  success: boolean
}

// エラーレスポンス型
export interface ApiErrorResponse {
  error: string
  details?: unknown
}

// API呼び出し結果のユニオン型
export type ApiResult<T> = T | ApiErrorResponse
