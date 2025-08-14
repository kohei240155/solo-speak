import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { UseFormSetValue } from 'react-hook-form'
import { UserSetupFormData, Language, UserSettingsResponse } from '@/types/userSettings'

export function useUserSettings(setValue: UseFormSetValue<UserSetupFormData>) {
  const { user } = useAuth()
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const fetchUserSettings = useCallback(async () => {
    try {
      // ユーザー設定データの取得（常にキャッシュをバイパス）
      const userData = await api.get<UserSettingsResponse>(`/api/user/settings?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        showErrorToast: false // 404エラー時のトースト表示を無効化
      })
      
      // 既存ユーザーの場合は設定完了とみなす
      setIsUserSetupComplete(true)
      
      // フォームに既存データを設定
      setValue('username', userData.username || '')
      setValue('iconUrl', userData.iconUrl || '/images/user-icon/user-icon.png')
      setValue('nativeLanguageId', userData.nativeLanguageId || '')
      setValue('defaultLearningLanguageId', userData.defaultLearningLanguageId || '')
      setValue('email', userData.email || '')
    } catch (error) {
      // 404エラー（初回ユーザー）かApiErrorかをチェック
      const is404Error = (
        (error instanceof Error && error.message.includes('404')) ||
        (error instanceof Error && error.message.includes('User not found'))
      )
      
      if (is404Error) {
        // 新規ユーザーの場合は設定未完了（エラーとして扱わない）
        setIsUserSetupComplete(false)
        setError('') // エラーメッセージをクリア
        
        // Googleアカウントの画像URLを取得して設定
        const googleAvatarUrl = user?.user_metadata?.avatar_url || 
                               user?.user_metadata?.picture || 
                               user?.user_metadata?.avatar
        
        // Googleアバターがある場合は設定
        if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                               googleAvatarUrl.includes('googleapis.com') || 
                               googleAvatarUrl.includes('google.com'))) {
          setValue('iconUrl', googleAvatarUrl)
        } else {
          // Googleアバターがない場合はデフォルト画像を設定
          setValue('iconUrl', '/images/user-icon/user-icon.png')
        }
        
        // Googleアカウントの情報を初期値として設定
        const displayName = user?.user_metadata?.full_name || 
                           user?.user_metadata?.name || 
                           user?.user_metadata?.display_name
        
        if (displayName) {
          setValue('username', displayName)
        }
        if (user?.email) {
          setValue('email', user.email)
        }
      } else {
        // その他のエラーの場合のみエラーメッセージを設定
        setIsUserSetupComplete(false)
        setError('ユーザー設定の取得に失敗しました。')
      }
    }
  }, [setValue, user, setIsUserSetupComplete])

  const fetchLanguages = useCallback(async () => {
    try {
      // ユーザー設定画面では常にDBから最新データを取得（キャッシュ無効）
      const data = await api.get<Language[]>(`/api/languages?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (Array.isArray(data) && data.length > 0) {
        setLanguages(data)
        setError('') // エラーをクリア
      } else {
        setError('言語データが見つかりません。データベースに言語データが登録されていない可能性があります。')
      }
    } catch {
      setError('言語データの取得に失敗しました。ネットワーク接続を確認してください。')
    }
  }, [])

  // データの並列初期化（再ログイン時は強制リフレッシュ）
  useEffect(() => {
    if (user) {
      
      Promise.all([
        fetchUserSettings(), // 初回読み込み時は常にフレッシュデータ
        fetchLanguages()
      ]).then(() => {
        setDataLoading(false)
      }).catch(() => {
        setDataLoading(false)
      })
    }
  }, [user, fetchUserSettings, fetchLanguages])

  return {
    languages,
    error,
    setError,
    isUserSetupComplete,
    setIsUserSetupComplete,
    dataLoading
  }
}
