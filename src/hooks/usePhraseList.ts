import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { Language, SavedPhrase } from '@/types/phrase'

export const usePhraseList = () => {
  const { user } = useAuth()
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [languages, setLanguages] = useState<Language[]>([])
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([])
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true)
  const [hasMorePhrases, setHasMorePhrases] = useState(true)
  const [phrasePage, setPhrasePage] = useState(1)
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [totalPhrases, setTotalPhrases] = useState(0)
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // 認証ヘッダーを取得するヘルパー関数
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
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
      console.log('User not logged in, skipping language fetch in usePhraseList')
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
      console.error('Error fetching languages in usePhraseList:', error)
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

  const fetchSavedPhrases = useCallback(async (page = 1, append = false) => {
    if (!user) return
    
    setIsLoadingPhrases(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phrase?userId=${user.id}&languageCode=${learningLanguage}&page=${page}&limit=10&minimal=true`, {
        headers
      })
      if (response.ok) {
        const data = await response.json()
        const phrases = Array.isArray(data.phrases) ? data.phrases : []
        
        if (append) {
          // 重複を避けるため、IDが既に存在しないアイテムのみを追加
          setSavedPhrases(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newPhrases = phrases.filter((phrase: SavedPhrase) => !existingIds.has(phrase.id))
            return [...prev, ...newPhrases]
          })
        } else {
          // 初回読み込み時も重複を除去
          const uniquePhrases = phrases.filter((phrase: SavedPhrase, index: number, self: SavedPhrase[]) => 
            self.findIndex((p: SavedPhrase) => p.id === phrase.id) === index
          )
          setSavedPhrases(uniquePhrases)
        }
        
        setHasMorePhrases(data.pagination?.hasMore || phrases.length === 10)
        setPhrasePage(page)
        setTotalPhrases(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching saved phrases:', error)
      if (!append) {
        setSavedPhrases([]) // エラー時は空配列に設定
      }
    } finally {
      setIsLoadingPhrases(false)
    }
  }, [user, learningLanguage, getAuthHeaders])

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
      fetchSavedPhrases(1, false)
    }
  }, [user, fetchUserSettings, fetchSavedPhrases])

  // 学習言語が変更されたときにフレーズを再取得
  useEffect(() => {
    if (user) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, user, fetchSavedPhrases])

  return {
    // State
    learningLanguage,
    languages,
    savedPhrases,
    isLoadingPhrases,
    hasMorePhrases,
    phrasePage,
    nativeLanguage,
    totalPhrases,
    
    // Handlers
    handleLearningLanguageChange,
    fetchSavedPhrases,
  }
}
