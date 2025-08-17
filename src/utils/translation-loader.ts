'use client'

import { TranslationData } from './translation-common'
import { FALLBACK_LANGUAGE } from '@/constants/languages'

// グローバルなキャッシュとローディング状態
const translationCache = new Map<string, TranslationData>()
const loadingPromises = new Map<string, Promise<TranslationData>>()

/**
 * 翻訳ファイルを効率的に読み込む関数
 * 重複リクエストを防ぐためにPromiseキャッシュを使用
 */
export async function loadTranslation(locale: string, namespace: string = 'common'): Promise<TranslationData> {
  const cacheKey = `${locale}-${namespace}`
  
  // キャッシュから取得
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!
  }

  // 既に同じリクエストが進行中の場合は、そのPromiseを再利用
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey)!
  }

  // 新しいリクエストを作成
  const loadPromise = (async (): Promise<TranslationData> => {
    try {
      const response = await fetch(`/locales/${locale}/${namespace}.json`)
      
      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.status}`)
      }
      
      const data = await response.json()
      
      // キャッシュに保存
      translationCache.set(cacheKey, data)
      return data
    } catch {
      // フォールバック：日本語の翻訳を試行
      if (locale !== FALLBACK_LANGUAGE) {
        try {
          const fallbackResponse = await fetch(`/locales/${FALLBACK_LANGUAGE}/${namespace}.json`)
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            // フォールバック結果もキャッシュ
            translationCache.set(cacheKey, fallbackData)
            return fallbackData
          }
        } catch {
          // フォールバック失敗は無視
        }
      }
      
      // 最終的なフォールバック：空のオブジェクト
      const emptyTranslation = {}
      translationCache.set(cacheKey, emptyTranslation)
      return emptyTranslation
    }
  })()

  // Promiseをキャッシュに保存
  loadingPromises.set(cacheKey, loadPromise)

  try {
    const result = await loadPromise
    return result
  } finally {
    // 完了後にPromiseキャッシュから削除
    loadingPromises.delete(cacheKey)
  }
}

/**
 * キャッシュをクリアする関数（テスト用など）
 */
export function clearTranslationCache(): void {
  translationCache.clear()
  loadingPromises.clear()
}

/**
 * 特定のロケールのキャッシュをクリアする関数
 */
export function clearLocaleCache(locale: string): void {
  const keysToDelete = Array.from(translationCache.keys()).filter(key => key.startsWith(`${locale}-`))
  keysToDelete.forEach(key => translationCache.delete(key))
  
  const promiseKeysToDelete = Array.from(loadingPromises.keys()).filter(key => key.startsWith(`${locale}-`))
  promiseKeysToDelete.forEach(key => loadingPromises.delete(key))
}
