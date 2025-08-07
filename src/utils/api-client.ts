// フロントエンド用の型安全なAPI呼び出し関数

import { api } from '@/utils/api'
import { 
  PhraseCountResponse, 
  SpeakPhraseResponse, 
  PhraseDetailResponse,
  ApiErrorResponse,
  ApiResult 
} from '@/types/api-responses'

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
 * Speak用フレーズを取得（型安全）
 */
export async function getSpeakPhrase(
  languageCode: string,
  options?: {
    order?: 'new_to_old' | 'old_to_new'
    excludeIfSpeakCountGTE?: number
    excludeTodayPracticed?: boolean
  }
): Promise<ApiResult<SpeakPhraseResponse>> {
  try {
    const params = new URLSearchParams({ language: languageCode })
    
    if (options?.order) params.append('order', options.order)
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
 * フレーズ詳細を取得（型安全）
 */
export async function getPhraseDetail(phraseId: string): Promise<ApiResult<PhraseDetailResponse>> {
  try {
    const response = await api.get(`/api/phrase/${phraseId}`)
    return (response as { data: PhraseDetailResponse }).data
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
