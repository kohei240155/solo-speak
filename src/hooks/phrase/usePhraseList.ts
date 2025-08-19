import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguages, useInfinitePhrases } from '@/hooks/api/useSWRApi'
import { DEFAULT_LANGUAGE, LANGUAGE_CODES } from '@/constants/languages'

export const usePhraseList = () => {
  const [learningLanguage, setLearningLanguage] = useState<string>(DEFAULT_LANGUAGE)

  const { languages } = useLanguages()
  const { userSettings } = useAuth()
  
  // 無限スクロール対応のフレーズリスト取得
  const { 
    phrases: savedPhrases, 
    hasMore: hasMorePhrases, 
    isLoading,
    isLoadingMore,
    setSize,
    refetch 
  } = useInfinitePhrases(learningLanguage)

  // ユーザー設定から言語を初期化
  useEffect(() => {
    if (userSettings?.defaultLearningLanguage?.code && learningLanguage === DEFAULT_LANGUAGE) {
      setLearningLanguage(userSettings.defaultLearningLanguage.code)
    }
  }, [userSettings, learningLanguage])

  // 言語変更ハンドラー
  const handleLearningLanguageChange = useCallback((language: string) => {
    setLearningLanguage(language)
  }, [])

  // 無限スクロール
  const loadMorePhrases = useCallback(() => {
    if (!isLoadingMore && hasMorePhrases) {
      setSize(size => size + 1)
    }
  }, [setSize, isLoadingMore, hasMorePhrases])

  // リフレッシュ
  const refreshPhrases = useCallback(() => {
    setSize(1)
    refetch()
  }, [setSize, refetch])

  return {
    learningLanguage,
    languages: languages || [],
    savedPhrases: savedPhrases || [],
    isLoadingPhrases: isLoading,
    isLoadingMore,
    hasMorePhrases: hasMorePhrases || false,
    nativeLanguage: userSettings?.nativeLanguage?.code || LANGUAGE_CODES.JAPANESE,
    handleLearningLanguageChange,
    loadMorePhrases,
    refreshPhrases,
  }
}