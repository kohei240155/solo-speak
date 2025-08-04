import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { Language } from '@/types/phrase'

export const usePhraseSettings = () => {
  const { user } = useAuth()
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [languages, setLanguages] = useState<Language[]>([])
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  const fetchLanguages = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return
    }

    try {
      const data = await api.get<Language[]>('/api/languages')
      setLanguages(data)
    } catch (error) {
      console.error('Error fetching languages in usePhraseSettings:', error)
      // 認証エラーの場合は言語リストを空にする
      setLanguages([])
    }
  }, [user])

  const fetchUserSettings = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return
    }

    try {
      const userData = await api.get<{ nativeLanguage?: { code: string }, defaultLearningLanguage?: { code: string } }>('/api/user/settings')
      // 初期化時のみユーザー設定を適用
      if (!userSettingsInitialized) {
        if (userData.nativeLanguage?.code) {
          setNativeLanguage(userData.nativeLanguage.code)
        }
        if (userData.defaultLearningLanguage?.code) {
          setLearningLanguage(userData.defaultLearningLanguage.code)
        }
        setUserSettingsInitialized(true)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }, [userSettingsInitialized, user])

  // 手動での言語変更ハンドラー
  const handleLearningLanguageChange = (language: string) => {
    setLearningLanguage(language)
    setUserSettingsInitialized(true) // 手動変更後は初期化フラグをセット
  }

  // 初期データ取得
  useEffect(() => {
    // ユーザーがログインしている場合のみ言語データを取得
    if (user) {
      fetchLanguages()
    }
  }, [fetchLanguages, user])

  useEffect(() => {
    if (user) {
      fetchUserSettings()
    }
  }, [user, fetchUserSettings])

  return {
    // State
    learningLanguage,
    languages,
    nativeLanguage,
    
    // Handlers
    handleLearningLanguageChange,
  }
}
