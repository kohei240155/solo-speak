import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { Language } from '@/types/phrase'

export const usePhraseSettings = () => {
  const { user } = useAuth()
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [languages, setLanguages] = useState<Language[]>([])
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // 認証ヘッダーを取得するヘルパー関数
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      console.warn('No authentication token available in usePhraseSettings')
      throw new Error('No authentication token available')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }, [])

  const fetchLanguages = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      console.log('User not logged in, skipping language fetch in usePhraseSettings')
      return
    }

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/languages', {
        method: 'GET',
        headers
      })
      if (response.ok) {
        const data = await response.json()
        setLanguages(data)
      } else {
        console.error('Failed to fetch languages:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching languages in usePhraseSettings:', error)
      // 認証エラーの場合は言語リストを空にする
      setLanguages([])
    }
  }, [getAuthHeaders, user])

  const fetchUserSettings = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return
    }

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/user/settings', {
        method: 'GET',
        headers
      })
      if (response.ok) {
        const userData = await response.json()
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
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }, [userSettingsInitialized, user, getAuthHeaders])

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
