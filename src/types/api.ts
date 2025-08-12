// 共通のAPIレスポンス型定義

// 基本のAPIレスポンス型
export interface BaseApiResponse {
  success?: boolean
}

// エラーレスポンス型
export interface ApiErrorResponse {
  error: string
  details?: unknown
}

// API呼び出し結果のユニオン型
export type ApiResult<T> = T | ApiErrorResponse

// 成功レスポンス型のジェネリック
export interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
  success: true
  data?: T
}

// バリデーションエラーの詳細型
export interface ValidationErrorDetail {
  code: string
  expected?: unknown
  received?: unknown
  path: (string | number)[]
  message: string
}

// Zodバリデーションエラーレスポンス型
export interface ZodErrorResponse extends ApiErrorResponse {
  error: 'Invalid request parameters' | 'Invalid request data'
  details: ValidationErrorDetail[]
}

// 認証エラーレスポンス型
export interface AuthErrorResponse extends ApiErrorResponse {
  error: 'Authorization header required' | 'Invalid token'
}

// 内部サーバーエラーレスポンス型
export interface InternalErrorResponse extends ApiErrorResponse {
  error: 'Internal server error'
  details?: string
}

// 404エラーレスポンス型
export interface NotFoundErrorResponse extends ApiErrorResponse {
  error: string // 'User not found', 'Phrase not found' etc.
}

// 一般的なエラーレスポンスのユニオン型
export type CommonApiErrorResponse = 
  | AuthErrorResponse
  | ZodErrorResponse
  | InternalErrorResponse
  | NotFoundErrorResponse

// HTTPステータスコードのマッピング型
export type ApiResponseWithStatus<T> = {
  200: ApiSuccessResponse<T>
  201: ApiSuccessResponse<T>
  400: ZodErrorResponse | ApiErrorResponse
  401: AuthErrorResponse
  404: NotFoundErrorResponse
  500: InternalErrorResponse
}

// Speak API専用の型定義
export interface SpeakPhraseApiResponse extends BaseApiResponse {
  success: boolean
  phrase?: {
    id: string
    japanese: string
    english: string
    pronunciation: string
    language_id: string
    level: number
    created_at: string
    updated_at: string
    practice_count: number
    correct_count: number
    language?: {
      id: string
      code: string
      name: string
      flag: string
    }
  }
  message?: string
  allDone?: boolean // All Done画面表示用フラグ
}
