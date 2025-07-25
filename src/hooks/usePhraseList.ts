import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { SavedPhrase } from '@/types/phrase'
import { useLanguages, useUserSettings } from '@/hooks/useSWRApi'

export const usePhraseList = () => {
  const { user } = useAuth()
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([])
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true)
  const [hasMorePhrases, setHasMorePhrases] = useState(true)
  const [phrasePage, setPhrasePage] = useState(1)
  const [totalPhrases, setTotalPhrases] = useState(0)
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // SWRフックを使用してデータを取得
  const { languages } = useLanguages()
  const { userSettings } = useUserSettings()

  // ユーザー設定から言語情報を初期化
  useEffect(() => {
    if (userSettings && !userSettingsInitialized) {
      if (userSettings.defaultLearningLanguage?.code) {
        setLearningLanguage(userSettings.defaultLearningLanguage.code)
      }
      setUserSettingsInitialized(true)
    }
  }, [userSettings, userSettingsInitialized])

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

  // 学習言語が変更されたときにフレーズを再取得
  useEffect(() => {
    if (user) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, user, fetchSavedPhrases])

  return {
    // State
    learningLanguage,
    languages: languages || [],
    savedPhrases,
    isLoadingPhrases,
    hasMorePhrases,
    phrasePage,
    nativeLanguage: userSettings?.nativeLanguage?.code || 'ja',
    totalPhrases,
    
    // Handlers
    handleLearningLanguageChange,
    fetchSavedPhrases,
  }
}
