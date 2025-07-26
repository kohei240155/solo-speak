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
 * 音声合成APIを呼び出す関数
 */
export async function generateSpeech(text: string, language?: string) {
  try {
    return await api.post('/api/speech', { text, language })
  } catch (error) {
    console.error('Failed to generate speech:', error)
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
 * Speak用のフレーズを取得する関数
 */
export async function getSpeakPhrase(params: {
  language?: string
  order?: string
  prioritizeLowPractice?: string
}): Promise<SpeakPhraseApiResponse> {
  try {
    const queryString = new URLSearchParams(params).toString()
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
