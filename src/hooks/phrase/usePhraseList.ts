import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguages, useInfinitePhrases } from '@/hooks/api/useSWRApi'
import { DEFAULT_LANGUAGE, LANGUAGE_CODES } from '@/constants/languages'

export const usePhraseList = () => {
  const [learningLanguage, setLearningLanguage] = useState<string>(DEFAULT_LANGUAGE)
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // SWRフックを使用してデータを取得
  const { languages } = useLanguages()
  const { userSettings } = useAuth() // AuthContextから直接ユーザー設定を取得
  
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

  // コンポーネントマウント時の積極的なデータ更新
  useEffect(() => {
    if (learningLanguage && !isLoading) {
      // ページ表示時に即座にデータを再取得（キャッシュを無視）
      const timer = setTimeout(() => {
        refetch()
      }, 50) // 50ms後に実行（高速化）

      return () => clearTimeout(timer)
    }
  }, [learningLanguage, isLoading, refetch]) // 依存配列を正しく設定

  // ページの可視性が変更された時（タブ切り替えなど）に再取得
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && learningLanguage) {
        // ページが再び表示された時に再取得
        setTimeout(() => {
          refetch()
        }, 100) // 遅延を短縮
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [learningLanguage, refetch])

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

  // 無限スクロール用の関数（SWRのネイティブ機能を使用・デバウンス付き）
  const loadMorePhrases = useCallback(() => {
    // 既にローディング中の場合は無視してリクエストの重複を防ぐ
    if (isLoadingMore) {
      return
    }
    setSize(size => size + 1)
  }, [setSize, isLoadingMore])

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
    nativeLanguage: userSettings?.nativeLanguage?.code || LANGUAGE_CODES.JAPANESE,
    totalPhrases: totalPhrases || 0,
    
    // Handlers
    handleLearningLanguageChange,
    loadMorePhrases,
    reloadPhrases,
    refreshPhrases,
  }
}
