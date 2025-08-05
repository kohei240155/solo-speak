'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  TranslationData, 
  TranslationOptions, 
  getNestedTranslation 
} from '@/utils/translation-common'

const translationCache = new Map<string, TranslationData>()

export const useTranslation = (namespace = 'common') => {
  const { locale, isLoadingLocale } = useLanguage()
  const [translations, setTranslations] = useState<TranslationData>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (isLoadingLocale) return

    const loadTranslations = async () => {
      const cacheKey = `${locale}-${namespace}`
      
      // キャッシュから取得
      if (translationCache.has(cacheKey)) {
        setTranslations(translationCache.get(cacheKey)!)
        setIsLoading(false)
        return
      }

      try {
        // 動的インポートで翻訳ファイルを読み込み
        const response = await fetch(`/locales/${locale}/${namespace}.json`)
        
        if (!response.ok) {
          throw new Error(`Failed to load translations: ${response.status}`)
        }
        
        const data = await response.json()
        
        // キャッシュに保存
        translationCache.set(cacheKey, data)
        setTranslations(data)
      } catch (error) {
        console.error(`Failed to load translations for ${locale}/${namespace}:`, error)
        
        // フォールバック：日本語の翻訳を試行
        if (locale !== 'ja') {
          try {
            const fallbackResponse = await fetch(`/locales/ja/${namespace}.json`)
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json()
              setTranslations(fallbackData)
            }
          } catch (fallbackError) {
            console.error('Failed to load fallback translations:', fallbackError)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadTranslations()
  }, [locale, namespace, isLoadingLocale])

  // 翻訳関数をuseCallbackでメモ化
  const t = useCallback((key: string, options?: TranslationOptions): string => {
    return getNestedTranslation(translations, key, options)
  }, [translations])

  return {
    t,
    locale,
    isLoading,
  }
}
