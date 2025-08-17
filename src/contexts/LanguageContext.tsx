'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UI_LANGUAGES, DEFAULT_LANGUAGE } from '@/constants/languages'

interface LanguageContextType {
  locale: string
  setLocale: (locale: string) => void
  availableLocales: string[]
  isLoadingLocale: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const AVAILABLE_LOCALES = Array.from(UI_LANGUAGES) as string[]
const DEFAULT_LOCALE = DEFAULT_LANGUAGE
const LOCALE_STORAGE_KEY = 'solo-speak-display-locale'

// ローカルストレージから言語設定を取得する関数
export const getStoredDisplayLanguage = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LOCALE_STORAGE_KEY)
}

// ローカルストレージに言語設定を保存する関数
export const setStoredDisplayLanguage = (locale: string): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // サーバーサイドでも適切な初期値を設定
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      // クライアントサイドでは即座に保存された値または検出された値を使用
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (savedLocale && AVAILABLE_LOCALES.includes(savedLocale)) {
        return savedLocale
      }
      
      const browserLanguage = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE
      const primaryLanguage = browserLanguage.split('-')[0].toLowerCase()
      return AVAILABLE_LOCALES.includes(primaryLanguage) ? primaryLanguage : DEFAULT_LOCALE
    }
    return DEFAULT_LOCALE
  })
  const [isLoadingLocale] = useState(false) // 初期状態はfalse、ロードは不要

  // ブラウザの言語設定から優先言語を検出
  const detectBrowserLanguage = (): string => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE

    const browserLanguage = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE
    const primaryLanguage = browserLanguage.split('-')[0].toLowerCase()
    
    // サポートされている言語かチェック
    return AVAILABLE_LOCALES.includes(primaryLanguage) ? primaryLanguage : DEFAULT_LOCALE
  }

  // 初期言語設定（軽量化）
  useEffect(() => {
    // クライアントサイドでの細かい調整のみ
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (!savedLocale) {
        // 保存された設定がない場合のみブラウザ言語を検出して保存
        const detectedLocale = detectBrowserLanguage()
        if (detectedLocale !== locale) {
          setLocaleState(detectedLocale)
          setStoredDisplayLanguage(detectedLocale)
        }
      }
    }
  }, [locale])

  // 外部からの言語変更イベントを監視（AuthContextからの通知）
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleDisplayLanguageChanged = (event: CustomEvent) => {
      const { locale: newLocale } = event.detail
      if (AVAILABLE_LOCALES.includes(newLocale) && newLocale !== locale) {
        setLocaleState(newLocale)
      }
    }

    window.addEventListener('displayLanguageChanged', handleDisplayLanguageChanged as EventListener)
    
    return () => {
      window.removeEventListener('displayLanguageChanged', handleDisplayLanguageChanged as EventListener)
    }
  }, [locale])

  // 言語変更ハンドラー
  const setLocale = (newLocale: string) => {
    if (AVAILABLE_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale)
      // ローカルストレージに即座に保存
      setStoredDisplayLanguage(newLocale)
      
      // App Routerでは言語切り替えは状態管理のみで行う
      // URLベースの言語切り替えは使用しない
    }
  }

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        availableLocales: AVAILABLE_LOCALES,
        isLoadingLocale,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
