'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LanguageContextType {
  locale: string
  setLocale: (locale: string) => void
  availableLocales: string[]
  isLoadingLocale: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const AVAILABLE_LOCALES = ['ja', 'en']
const DEFAULT_LOCALE = 'ja'
const LOCALE_STORAGE_KEY = 'solo-speak-display-locale'

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LOCALE)
  const [isLoadingLocale, setIsLoadingLocale] = useState(true)

  // ブラウザの言語設定から優先言語を検出
  const detectBrowserLanguage = (): string => {
    if (typeof window === 'undefined') return DEFAULT_LOCALE

    const browserLanguage = navigator.language || navigator.languages?.[0] || DEFAULT_LOCALE
    const primaryLanguage = browserLanguage.split('-')[0].toLowerCase()
    
    // サポートされている言語かチェック
    return AVAILABLE_LOCALES.includes(primaryLanguage) ? primaryLanguage : DEFAULT_LOCALE
  }

  // 初期言語設定
  useEffect(() => {
    const initializeLocale = () => {
      // ローカルストレージから保存された言語設定を取得
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      
      let targetLocale = DEFAULT_LOCALE
      
      if (savedLocale && AVAILABLE_LOCALES.includes(savedLocale)) {
        // 保存された言語設定がある場合はそれを使用
        targetLocale = savedLocale
      } else {
        // 保存された設定がない場合はブラウザの言語設定を検出
        targetLocale = detectBrowserLanguage()
      }
      
      setLocaleState(targetLocale)
      setIsLoadingLocale(false)
    }

    initializeLocale()
  }, [])

  // 言語変更ハンドラー
  const setLocale = (newLocale: string) => {
    if (AVAILABLE_LOCALES.includes(newLocale)) {
      setLocaleState(newLocale)
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
      
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
