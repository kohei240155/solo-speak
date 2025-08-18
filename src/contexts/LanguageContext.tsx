'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UI_LANGUAGES, DEFAULT_LANGUAGE } from '@/constants/languages'

interface LanguageContextType {
  locale: string
  setLocale: (locale: string) => void
  availableLocales: string[]
  isLoadingLocale: boolean
  isUserLanguageMode: boolean
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
  // 初期言語設定を日本語に固定（Top画面の初期表示は必ず日本語）
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      // クライアントサイドでは保存された値を優先、なければ日本語に設定
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (savedLocale && AVAILABLE_LOCALES.includes(savedLocale)) {
        return savedLocale
      }
      
      // 保存された設定がない場合は日本語を設定
      return DEFAULT_LOCALE
    }
    return DEFAULT_LOCALE
  })
  const [isLoadingLocale] = useState(false) // 初期状態はfalse、ロードは不要
  const [isUserLanguageMode, setIsUserLanguageMode] = useState(false) // ユーザー言語モードフラグ

  // 初期言語設定（日本語優先）
  useEffect(() => {
    // クライアントサイドでの調整
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (!savedLocale) {
        // 保存された設定がない場合は日本語を設定して保存
        if (locale !== DEFAULT_LOCALE) {
          setLocaleState(DEFAULT_LOCALE)
          setStoredDisplayLanguage(DEFAULT_LOCALE)
        }
      }
    }
  }, [locale])

  // 外部からの言語変更イベントを監視（AuthContextからの通知）
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleDisplayLanguageChanged = (event: CustomEvent) => {
      const { locale: newLocale, isUserLanguage } = event.detail
      if (AVAILABLE_LOCALES.includes(newLocale) && newLocale !== locale) {
        setLocaleState(newLocale)
        setIsUserLanguageMode(isUserLanguage || false)
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
      setIsUserLanguageMode(false) // 手動変更時はユーザー言語モードを解除
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
        isUserLanguageMode,
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
