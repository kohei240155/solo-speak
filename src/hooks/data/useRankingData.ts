import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguages, useRanking } from '@/hooks/api/useSWRApi'
import { DEFAULT_LANGUAGE } from '@/constants/languages'

export const useRankingData = () => {
  const { languages } = useLanguages()
  const { userSettings } = useAuth() // AuthContextから直接ユーザー設定を取得

  // ユーザーのデフォルト学習言語を初期値として設定
  const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
    return userSettings?.defaultLearningLanguage?.code || DEFAULT_LANGUAGE
  })
  const [activeTab, setActiveTab] = useState('Total') // Phraseがデフォルトなので初期値はTotal
  const [activeRankingType, setActiveRankingType] = useState<'phrase' | 'speak' | 'quiz'>('phrase')

  // SWRフックを使用してデータを取得

  // ランキングデータを取得
  // Phraseの場合は常にtotal、それ以外はactiveTabに基づいてperiodを決定
  const period = activeRankingType === 'phrase' ? 'total' : (activeTab.toLowerCase() as 'daily' | 'weekly' | 'total')
  const { 
    rankingData, 
    currentUser,
    isLoading, 
    error, 
    message, 
    refetch 
  } = useRanking(activeRankingType, selectedLanguage, period)

  // ユーザー設定が読み込まれた時に言語を初期化（初回のみ）
  useEffect(() => {
    if (userSettings?.defaultLearningLanguage?.code && 
        (selectedLanguage === DEFAULT_LANGUAGE || !selectedLanguage)) {
      setSelectedLanguage(userSettings.defaultLearningLanguage.code)
    }
  }, [userSettings?.defaultLearningLanguage?.code, selectedLanguage])

  // 言語変更ハンドラー
  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
  }

  // タブ変更ハンドラー
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  // ランキングタイプ変更ハンドラー
  const handleRankingTypeChange = (type: 'phrase' | 'speak' | 'quiz') => {
    setActiveRankingType(type)
    
    // ランキングタイプ変更時に適切なタブを設定
    if (type === 'phrase') {
      setActiveTab('Total')
    } else if (type === 'speak' || type === 'quiz') {
      setActiveTab('Daily')
    }
  }

  // 手動リフレッシュ関数
  const refreshRanking = () => {
    refetch()
  }

  return {
    // State
    selectedLanguage,
    activeTab,
    activeRankingType,
    languages: languages || [],
    rankingData: rankingData || [],
    currentUser,
    isLoading,
    error,
    message,

    // Handlers
    handleLanguageChange,
    handleTabChange,
    handleRankingTypeChange,
    refreshRanking,
  }
}
