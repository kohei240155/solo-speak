import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
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

  const fetchLanguages = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      console.log('User not logged in, skipping language fetch in usePhraseList')
      return
    }

    try {
      const data = await api.get<Language[]>('/api/languages')
      setLanguages(data)
    } catch (error) {
      console.error('Error fetching languages in usePhraseList:', error)
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

  const fetchSavedPhrases = useCallback(async (page = 1, append = false) => {
    if (!user) return
    
    setIsLoadingPhrases(true)
    try {
      const data = await api.get<{ phrases: SavedPhrase[], pagination?: { hasMore: boolean, total: number } }>(`/api/phrase?userId=${user.id}&languageCode=${learningLanguage}&page=${page}&limit=10&minimal=true`)
      const phrases = Array.isArray(data.phrases) ? data.phrases : []
      
      if (append) {
        // 重複を避けるため、IDが既に存在しないアイテムのみを追加
        setSavedPhrases(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const newPhrases = phrases.filter((phrase: SavedPhrase) => !existingIds.has(phrase.id))
          return newPhrases.length > 0 ? [...prev, ...newPhrases] : prev
        })
      } else {
        // 初回読み込み時は重複除去処理を簡略化
        setSavedPhrases(phrases)
      }
      
      setHasMorePhrases(data.pagination?.hasMore || phrases.length === 10)
      setPhrasePage(page)
      setTotalPhrases(data.pagination?.total || 0)
    } catch (error) {
      console.error('Error fetching saved phrases:', error)
      if (!append) {
        setSavedPhrases([]) // エラー時は空配列に設定
      }
    } finally {
      setIsLoadingPhrases(false)
    }
  }, [user, learningLanguage])

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
