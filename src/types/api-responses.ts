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
  success: true
  phrase?: PhraseResponse
  message?: string
  allDone?: boolean
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
