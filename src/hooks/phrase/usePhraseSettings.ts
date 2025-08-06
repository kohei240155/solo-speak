import { useState, useEffect } from 'react'
import { useUserSettings, useLanguages } from '@/hooks/api/useSWRApi'

export const usePhraseSettings = () => {
  const { userSettings } = useUserSettings() // SWRベースのフックを使用
  const { languages } = useLanguages() // SWRベースの言語取得フック
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // SWRのuserSettingsからデータを設定
  useEffect(() => {
    if (userSettings && !userSettingsInitialized) {
      if (userSettings.nativeLanguage?.code) {
        setNativeLanguage(userSettings.nativeLanguage.code)
      }
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

  return {
    // State
    learningLanguage,
    languages: languages || [],
    nativeLanguage,
    
    // Handlers
    handleLearningLanguageChange,
  }
}
