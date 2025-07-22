import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/spabase'

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
  birthdate?: string
  gender?: string
  email: string
  defaultQuizCount: number
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

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証が必要です')
        return
      }

      // 言語一覧を取得
      const languagesResponse = await fetch('/api/languages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (languagesResponse.ok) {
        const languagesData = await languagesResponse.json()
        setLanguages(languagesData)
      }

      // ユーザー設定を取得
      const settingsResponse = await fetch(`/api/user/settings?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setUserSettings(settingsData)
      } else if (settingsResponse.status === 404) {
        // ユーザー設定が未作成の場合
        setUserSettings(null)
      } else {
        throw new Error('ユーザー設定の取得に失敗しました')
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
