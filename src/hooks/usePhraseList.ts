import { useState, useEffect, useCallback } from 'react'
import { useLanguages, useUserSettings, useInfinitePhrases } from '@/hooks/useSWRApi'

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

  // ページ表示時に最新データを取得
  useEffect(() => {
    if (learningLanguage && !isLoading) {
      refetch() // キャッシュを無視して最新データを取得
    }
  }, [learningLanguage, refetch, isLoading])

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

  // フレーズを取得する関数（無限スクロール用）
  const fetchSavedPhrases = useCallback(async (page: number, append: boolean) => {
    if (append) {
      // 次のページを読み込み
      setSize(page)
    } else {
      // 最初から再読み込み
      setSize(1)
      refetch()
    }
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
    fetchSavedPhrases,
    refreshPhrases,
  }
}
