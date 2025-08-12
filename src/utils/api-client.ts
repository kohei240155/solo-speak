// フロントエンド用の型安全なAPI呼び出し関数

import { api } from '@/utils/api'
import { 
  PhraseCountResponse, 
  SpeakPhraseResponse, 
  SpeakPhraseCountResponse
} from '@/types/phrase'
import { ApiErrorResponse, ApiResult } from '@/types/api-responses'

/**
 * フレーズのカウントを更新（型安全）
 */
export async function updatePhraseCount(
  phraseId: string, 
  count: number = 1
): Promise<ApiResult<PhraseCountResponse>> {
  try {
    const response = await api.post(`/api/phrase/${phraseId}/count`, { count })
    return (response as { data: PhraseCountResponse }).data
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error && error.response) {
      return ((error.response as { data: ApiErrorResponse }).data)
    }
    return { error: 'Network error' } as ApiErrorResponse
  }
}

/**
 * Speak用フレーズの数を取得（型安全）
 */
export async function getSpeakPhraseCount(
  languageCode: string,
  options?: {
    excludeIfSpeakCountGTE?: number
    excludeTodayPracticed?: boolean
  }
): Promise<ApiResult<SpeakPhraseCountResponse>> {
  try {
    const params = new URLSearchParams({ language: languageCode })
    
    if (options?.excludeIfSpeakCountGTE !== undefined) {
      params.append('excludeIfSpeakCountGTE', options.excludeIfSpeakCountGTE.toString())
    }
    if (options?.excludeTodayPracticed) {
      params.append('excludeTodayPracticed', 'true')
    }

    const response = await api.get(`/api/phrase/speak/count?${params.toString()}`)
    // レスポンスが直接SpeakPhraseCountResponseの形式の場合
    if (response && typeof response === 'object' && 'success' in response) {
      return response as SpeakPhraseCountResponse
    }
    // レスポンスがdata プロパティにラップされている場合
    if (response && typeof response === 'object' && 'data' in response) {
      return (response as { data: SpeakPhraseCountResponse }).data
    }
    // 予期しない形式の場合
    return { error: 'Invalid response format' } as ApiErrorResponse
  } catch (error: unknown) {
    console.error('Error in getSpeakPhraseCount:', error)
    if (error && typeof error === 'object' && 'response' in error && error.response) {
      return ((error.response as { data: ApiErrorResponse }).data)
    }
    return { error: 'Network error' } as ApiErrorResponse
  }
}

/**
 * Speak用フレーズを取得（型安全）
 */
export async function getSpeakPhrase(
  languageCode: string,
  options?: {
    excludeIfSpeakCountGTE?: number
    excludeTodayPracticed?: boolean
  }
): Promise<ApiResult<SpeakPhraseResponse>> {
  try {
    const params = new URLSearchParams({ language: languageCode })
    
    if (options?.excludeIfSpeakCountGTE !== undefined) {
      params.append('excludeIfSpeakCountGTE', options.excludeIfSpeakCountGTE.toString())
    }
    if (options?.excludeTodayPracticed) {
      params.append('excludeTodayPracticed', 'true')
    }

    const response = await api.get(`/api/phrase/speak?${params.toString()}`)
    return (response as { data: SpeakPhraseResponse }).data
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error && error.response) {
      return ((error.response as { data: ApiErrorResponse }).data)
    }
    return { error: 'Network error' } as ApiErrorResponse
  }
}

/**
 * レスポンスがエラーかどうかをチェックする型ガード
 */
export function isApiError<T>(response: ApiResult<T>): response is ApiErrorResponse {
  return typeof response === 'object' && response !== null && 'error' in response
}

/**
 * レスポンスが成功かどうかをチェックする型ガード
 */
export function isApiSuccess<T>(response: ApiResult<T>): response is T {
  return !isApiError(response)
}
