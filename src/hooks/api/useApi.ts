import { api } from '@/utils/api'
import { SpeakPhraseApiResponse } from '@/types/api'

/**
 * フレーズの練習カウントを更新する関数
 */
export async function updatePhraseCount(phraseId: string) {
  try {
    return await api.post(`/api/phrase/${phraseId}/count`)
  } catch (error) {
    console.error('Failed to update phrase count:', error)
    throw error
  }
}

/**
 * フレーズを削除する関数
 */
export async function deletePhrase(phraseId: string) {
  try {
    return await api.delete(`/api/phrase/${phraseId}`)
  } catch (error) {
    console.error('Failed to delete phrase:', error)
    throw error
  }
}

/**
 * フレーズを更新する関数
 */
export async function updatePhrase(phraseId: string, updates: Record<string, unknown>) {
  try {
    return await api.put(`/api/phrase/${phraseId}`, updates)
  } catch (error) {
    console.error('Failed to update phrase:', error)
    throw error
  }
}

/**
 * 個別フレーズのsession_spokenをtrueに設定する関数
 */
export async function markPhraseAsSessionSpoken(phraseId: string) {
  try {
    return await api.post(`/api/phrase/${phraseId}/session-spoken`)
  } catch (error) {
    console.error('Failed to mark phrase as session spoken:', error)
    throw error
  }
}

/**
 * ユーザーの全フレーズのsession_spokenをfalseにリセットする関数
 */
export async function resetSessionSpoken() {
  try {
    return await api.post('/api/phrases/reset-session')
  } catch (error) {
    console.error('Failed to reset session spoken:', error)
    throw error
  }
}

/**
 * Speak用のフレーズを取得する関数
 */
export async function getSpeakPhrase(params: {
  language?: string
  order?: string
  prioritizeLowPractice?: string
  excludeIfSpeakCountGTE?: string
  excludeTodayPracticed?: string
}): Promise<SpeakPhraseApiResponse> {
  try {
    // undefinedの値を除去してクエリストリングを作成
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    )
    const queryString = new URLSearchParams(filteredParams).toString()
    return await api.get<SpeakPhraseApiResponse>(`/api/phrase/speak?${queryString}`)
  } catch (error) {
    console.error('Failed to get speak phrase:', error)
    throw error
  }
}

/**
 * ユーザー設定を取得する関数
 */
export async function getUserSettings() {
  try {
    return await api.get('/api/user/settings')
  } catch (error) {
    console.error('Failed to get user settings:', error)
    throw error
  }
}

/**
 * 言語リストを取得する関数
 */
export async function getLanguages() {
  try {
    return await api.get('/api/languages')
  } catch (error) {
    console.error('Failed to get languages:', error)
    throw error
  }
}
