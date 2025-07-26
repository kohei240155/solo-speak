import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { UseFormSetValue } from 'react-hook-form'
import { UserSetupFormData, Language } from '@/types/userSettings'

export function useUserSettings(setValue: UseFormSetValue<UserSetupFormData>) {
  const { user } = useAuth()
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  const fetchUserSettings = useCallback(async () => {
    try {
      // ユーザー設定データの取得（常にキャッシュをバイパス）
      const userData = await api.get<{
        username?: string,
        iconUrl?: string,
        nativeLanguageId?: string,
        defaultLearningLanguageId?: string,
        birthdate?: string,
        gender?: string,
        email?: string,
        defaultQuizCount?: number
      }>(`/api/user/settings?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      // 既存ユーザーの場合は設定完了とみなす
      setIsUserSetupComplete(true)
      
      // フォームに既存データを設定
      setValue('username', userData.username || '')
      setValue('iconUrl', userData.iconUrl || '')
      console.log('Settings: Setting iconUrl in form:', {
        iconUrl: userData.iconUrl,
        type: typeof userData.iconUrl,
        length: userData.iconUrl?.length,
        timestamp: new Date().toISOString()
      })
      setValue('nativeLanguageId', userData.nativeLanguageId || '')
      setValue('defaultLearningLanguageId', userData.defaultLearningLanguageId || '')
      setValue('birthdate', userData.birthdate ? userData.birthdate.split('T')[0] : '')
      setValue('gender', userData.gender || '')
      setValue('email', userData.email || '')
      setValue('defaultQuizCount', userData.defaultQuizCount || 10)
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        // 新規ユーザーの場合は設定未完了
        setIsUserSetupComplete(false)
        
        // Googleアカウントの画像URLを取得して設定
        // avatar_url, picture, avatar などの可能性を考慮
        const googleAvatarUrl = user?.user_metadata?.avatar_url || 
                               user?.user_metadata?.picture || 
                               user?.user_metadata?.avatar
        
        console.log('User metadata for avatar:', {
          avatar_url: user?.user_metadata?.avatar_url,
          picture: user?.user_metadata?.picture,
          avatar: user?.user_metadata?.avatar,
          selected: googleAvatarUrl
        })
        
        // Googleアバターがある場合は設定、ない場合は空文字列（デフォルトシルエット表示）
        if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                               googleAvatarUrl.includes('googleapis.com') || 
                               googleAvatarUrl.includes('google.com'))) {
          console.log('Setting Google avatar URL directly:', googleAvatarUrl)
          setValue('iconUrl', googleAvatarUrl)
        } else {
          // Googleアバターがない場合は空の iconUrl を設定（デフォルトアイコンを表示）
          console.log('No valid Google avatar found, setting empty iconUrl')
          setValue('iconUrl', '')
        }
        
        // Googleアカウントの情報を初期値として設定（iconUrl以外）
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
        console.error('Error fetching user settings:', error)
        setIsUserSetupComplete(false)
      }
    }
  }, [setValue, user, setIsUserSetupComplete])

  const fetchLanguages = useCallback(async () => {
    try {
      const data = await api.get<Language[]>('/api/languages')
      
      if (Array.isArray(data) && data.length > 0) {
        setLanguages(data)
        setError('') // エラーをクリア
      } else {
        setError('言語データが見つかりません。データベースに言語データが登録されていない可能性があります。')
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
      setError('言語データの取得に失敗しました。ネットワーク接続を確認してください。')
    }
  }, [])

  // データの並列初期化（再ログイン時は強制リフレッシュ）
  useEffect(() => {
    if (user) {
      console.log('useUserSettings: User logged in, user metadata:', {
        user_metadata: user.user_metadata,
        avatar_url: user.user_metadata?.avatar_url,
        picture: user.user_metadata?.picture,
        avatar: user.user_metadata?.avatar
      })
      
      Promise.all([
        fetchUserSettings(), // 初回読み込み時は常にフレッシュデータ
        fetchLanguages()
      ]).then(() => {
        setDataLoading(false)
      }).catch(error => {
        console.error('Error loading initial data:', error)
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
