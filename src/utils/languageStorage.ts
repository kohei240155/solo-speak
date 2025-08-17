/**
 * 学習言語の設定をブラウザストレージで管理するユーティリティ
 */

const LEARNING_LANGUAGE_KEY = 'solo-speak-learning-language'

/**
 * ローカルストレージから学習言語を取得
 */
export const getStoredLearningLanguage = (): string | null => {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    return localStorage.getItem(LEARNING_LANGUAGE_KEY)
  } catch {
    return null
  }
}

/**
 * ローカルストレージに学習言語を保存
 */
export const setStoredLearningLanguage = (language: string): void => {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.setItem(LEARNING_LANGUAGE_KEY, language)
  } catch {
    // ストレージアクセスに失敗した場合は何もしない
  }
}

/**
 * ローカルストレージから学習言語を削除
 */
export const removeStoredLearningLanguage = (): void => {
  if (typeof window === 'undefined') {
    return
  }
  
  try {
    localStorage.removeItem(LEARNING_LANGUAGE_KEY)
  } catch {
    // ストレージアクセスに失敗した場合は何もしない
  }
}
