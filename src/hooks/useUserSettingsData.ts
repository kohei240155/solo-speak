import { useState, useEffect, useCallback } from 'react'
import { api } from '@/utils/api'

interface Language {
  id: string
  name: string
  code: string
}

interface UserSettings {
  username: string
  iconUrl?: string
  nativeLanguage: Language
  defaultLearningLanguage: Language
  email: string
}

interface UseUserSettingsDataReturn {
  userSettings: UserSettings | null
  languages: Language[]
  loading: boolean
  error: string | null
}

export function useUserSettingsData(): UseUserSettingsDataReturn {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 言語一覧を取得
      const languagesData = await api.get<Language[]>('/api/languages')
      setLanguages(languagesData)

      // ユーザー設定を取得
      try {
        const settingsData = await api.get<UserSettings>(`/api/user/settings?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        setUserSettings(settingsData)
      } catch (settingsError) {
        if (settingsError instanceof Error && settingsError.message.includes('404')) {
          // ユーザー設定が未作成の場合
          setUserSettings(null)
        } else {
          throw new Error('ユーザー設定の取得に失敗しました')
        }
      }

    } catch (err) {
      console.error('Error fetching user settings:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    userSettings,
    languages,
    loading,
    error,
  }
}
