'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { loadTranslation } from '@/utils/translation-loader'

/**
 * アプリケーション起動時に翻訳ファイルを事前読み込みするフック
 */
export const useTranslationPreloader = () => {
  const { locale, availableLocales } = useLanguage()

  useEffect(() => {
    // 現在の言語の翻訳ファイルを事前読み込み
    const preloadCurrentLanguage = async () => {
      try {
        await loadTranslation(locale, 'common')
      } catch {
        // エラーは無視（useTranslationで適切にハンドリングされる）
      }
    }

    preloadCurrentLanguage()
  }, [locale])

  useEffect(() => {
    // 他の利用可能な言語の翻訳ファイルを低優先度で事前読み込み
    const preloadOtherLanguages = async () => {
      const otherLocales = availableLocales.filter(loc => loc !== locale)
      
      // 少し遅延を入れて低優先度で読み込み
      setTimeout(() => {
        otherLocales.forEach(async (loc) => {
          try {
            await loadTranslation(loc, 'common')
          } catch {
            // エラーは無視
          }
        })
      }, 1000) // 1秒後に開始
    }

    preloadOtherLanguages()
  }, [locale, availableLocales])
}
