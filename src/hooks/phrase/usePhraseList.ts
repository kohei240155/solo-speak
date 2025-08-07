import { useState, useEffect, useCallback } from 'react'
import { useLanguages, useUserSettings, useInfinitePhrases } from '@/hooks/api/useSWRApi'

export const usePhraseList = () => {
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // SWRフックを使用してデータを取得
  const { languages } = useLanguages()
  const { userSettings } = useUserSettings()
  
  // 無限スクロール対応のフレーズリスト取得
  const { 
    phrases: savedPhrases, 
    totalCount: totalPhrases, 
    hasMore: hasMorePhrases, 
    isLoading,
    isLoadingMore,
    size: phrasePage,
    setSize,
    refetch 
  } = useInfinitePhrases(learningLanguage)

  // 言語変更時は自動的に新しいキーで再フェッチされるため、手動refetchは不要
  // useEffect(() => {
  //   if (learningLanguage && !isLoading) {
  //     refetch() // SWRが自動的にキー変更を検出して再フェッチするため不要
  //   }
  // }, [learningLanguage, refetch, isLoading])

  // ユーザー設定から言語情報を初期化
  useEffect(() => {
    if (userSettings && !userSettingsInitialized) {
      if (userSettings.defaultLearningLanguage?.code) {
        setLearningLanguage(userSettings.defaultLearningLanguage.code)
      }
      setUserSettingsInitialized(true)
    }
  }, [userSettings, userSettingsInitialized])

  // 手動での言語変更ハンドラー
  const handleLearningLanguageChange = (language: string) => {
    setLearningLanguage(language)
    setUserSettingsInitialized(true) // 手動変更後は初期化フラグをセット
  }

  // 無限スクロール用の関数（SWRのネイティブ機能を使用）
  const loadMorePhrases = useCallback(() => {
    setSize(size => size + 1)
  }, [setSize])

  // 最初からリロード（SWRの機能を活用）
  const reloadPhrases = useCallback(() => {
    setSize(1)
    refetch()
  }, [setSize, refetch])

  // 手動リフレッシュ関数
  const refreshPhrases = useCallback(() => {
    refetch()
  }, [refetch])

  return {
    // State
    learningLanguage,
    languages: languages || [],
    savedPhrases: savedPhrases || [],
    isLoadingPhrases: isLoading || isLoadingMore, // 初回またはページ追加読み込み
    isLoadingMore, // 追加ページ読み込み専用
    hasMorePhrases: hasMorePhrases || false,
    phrasePage,
    nativeLanguage: userSettings?.nativeLanguage?.code || 'ja',
    totalPhrases: totalPhrases || 0,
    
    // Handlers
    handleLearningLanguageChange,
    loadMorePhrases,
    reloadPhrases,
    refreshPhrases,
  }
}
