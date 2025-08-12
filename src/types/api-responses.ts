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

// フレーズカウント更新のレスポンス型（フロントエンド・バックエンド共通）
export interface PhraseCountResponse extends BaseApiResponse {
  success: true
  phrase: {
    id: string
    original: string
    translation: string
    totalSpeakCount: number
    dailySpeakCount: number
  }
}

// フレーズ取得のレスポンス型
export interface PhraseResponse {
  id: string
  original: string
  translation: string
  explanation?: string
  totalSpeakCount: number
  dailySpeakCount: number
  languageCode: string
}

// Speak API レスポンス型
export interface SpeakPhraseResponse extends BaseApiResponse {
  success: boolean
  phrase?: PhraseResponse
  message?: string
  allDone?: boolean
}

// Speak用フレーズカウントレスポンス型
export interface SpeakPhraseCountResponse extends BaseApiResponse {
  success: boolean
  count: number
  message?: string
}

// フレーズ詳細取得レスポンス型
export interface PhraseDetailResponse {
  id: string
  original: string
  translation: string
  totalSpeakCount: number
  dailySpeakCount: number
  language: {
    id: string
    name: string
    code: string
  }
}

// API呼び出し結果のユニオン型
export type ApiResult<T> = T | ApiErrorResponse

// ユーザー日次リセットレスポンス型
export interface UserDailyResetResponse {
  success: boolean
  reset: boolean
  message: string
  count: number
  lastSpeakingDate: Date | null
}

// 残りのフレーズ生成回数レスポンス型
export interface RemainingGenerationsResponse {
  remainingGenerations: number
}

// シチュエーション一覧レスポンス型
export interface SituationsListResponse {
  situations: Array<{
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }>
}
