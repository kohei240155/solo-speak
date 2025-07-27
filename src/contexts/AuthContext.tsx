'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { api, ApiError } from '@/utils/api'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  userIconUrl: string | null
  isUserSetupComplete: boolean
  shouldRedirectToSettings: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  updateUserMetadata: (metadata: Record<string, string>) => Promise<void>
  refreshUser: () => Promise<void>
  refreshUserSettings: () => Promise<void>
  refreshSession: () => Promise<void>
  clearSettingsRedirect: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null)
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)
  const [shouldRedirectToSettings, setShouldRedirectToSettings] = useState(false)

  useEffect(() => {
    // タイムアウト設定（5秒後に強制的にローディング解除）
    const loadingTimeout = setTimeout(() => {
      console.warn('認証チェックがタイムアウトしました。ローディングを強制解除します。')
      setLoading(false)
      setSession(null)
      setUser(null)
      setUserIconUrl(null)
      setIsUserSetupComplete(false)
      
      // ローカル認証情報もクリア
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase.auth.token')
        window.sessionStorage.removeItem('supabase.auth.token')
      }
    }, 5000)

    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('セッション取得エラー:', error)
          // エラー時はローカル認証情報をクリア（サーバー通信なしで）
          try {
            await supabase.auth.signOut()
          } catch (signOutError) {
            console.warn('signOut通信エラー（ローカル情報はクリア済み）:', signOutError)
            // ローカルストレージから認証情報を手動でクリア
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('supabase.auth.token')
              window.sessionStorage.removeItem('supabase.auth.token')
            }
          }
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (e) {
        console.error('セッション取得で例外発生:', e)
        // 例外時はローカル認証情報をクリア（サーバー通信なしで）
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.warn('signOut通信エラー（ローカル情報はクリア済み）:', signOutError)
          // ローカルストレージから認証情報を手動でクリア
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('supabase.auth.token')
            window.sessionStorage.removeItem('supabase.auth.token')
          }
        }
        setSession(null)
        setUser(null)
      } finally {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          setSession(session)
          setUser(session?.user ?? null)
          // ユーザー状態が変更されたらアイコンURLもリセット
          if (!session?.user) {
            setUserIconUrl(null)
            setIsUserSetupComplete(false)
          }
        } catch (e) {
          console.error('認証状態変更処理で例外:', e)
          setSession(null)
          setUser(null)
          setUserIconUrl(null)
          setIsUserSetupComplete(false)
        } finally {
          clearTimeout(loadingTimeout)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [])

  const signOut = async () => {
    // TOPページに即座に遷移
    router.push('/')
    
    // その後でローカル状態をクリア
    setUser(null)
    setSession(null)
    setUserIconUrl(null)
    setIsUserSetupComplete(false)
    
    // Supabaseからのログアウト（バックグラウンドで実行）
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.warn('Supabaseサインアウト通信エラー（ローカル情報はクリア済み）:', error)
      // ローカルストレージから認証情報を手動でクリア
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('supabase.auth.token')
        window.sessionStorage.removeItem('supabase.auth.token')
      }
    }
    
    // ユーザー設定関連のローカルストレージをクリア（もしあれば）
    if (typeof window !== 'undefined') {
      // ヘッダー関連の状態をクリアするためのカスタムイベントを発行
      window.dispatchEvent(new Event('userSignedOut'))
    }
  }

  const signInWithGoogle = async () => {
    // 本番環境では明示的に設定されたドメインを使用
    const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
    const redirectUrl = `${productionUrl}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })
    return { error }
  }

  const updateUserMetadata = async (metadata: Record<string, string>) => {
    if (!user) return

    const { error } = await supabase.auth.updateUser({
      data: metadata
    })

    if (error) {
      console.error('Failed to update user metadata:', error)
    }
  }

  const refreshUserSettings = useCallback(async () => {
    if (!user?.id || !session) {
      setIsUserSetupComplete(false)
      setUserIconUrl(null)
      return
    }

    try {
      const userData = await api.get<{ iconUrl?: string }>('/api/user/settings', {
        showErrorToast: false // 404エラー時のトーストを無効化
      })
      
      // ユーザーが存在する場合
      setIsUserSetupComplete(true)
      
      // DBのアイコンURLがある場合は使用
      if (userData.iconUrl && userData.iconUrl.trim() !== '') {
        setUserIconUrl(userData.iconUrl)
      } else {
        // DBにアイコンURLがない場合はGoogleアバターを使用
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        if (googleAvatarUrl) {
          setUserIconUrl(googleAvatarUrl)
        } else {
          setUserIconUrl(null)
        }
      }
    } catch (error) {
      // 404エラー（ユーザーが存在しない）の場合は初回セットアップ
      if (error instanceof ApiError && error.status === 404) {
        console.log('Initial user setup required - user not found in database')
        setIsUserSetupComplete(false)
        setShouldRedirectToSettings(true)
        
        // Googleアバターがある場合は表示
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        setUserIconUrl(googleAvatarUrl || null)
      } else {
        // その他のエラーの場合
        console.error('Error fetching user settings:', error)
        setIsUserSetupComplete(false)
        
        // Googleアバターがある場合は保持
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        setUserIconUrl(googleAvatarUrl || null)
      }
    }
  }, [user?.id, session, user?.user_metadata?.avatar_url, user?.user_metadata?.picture])

  // ユーザーとセッションが利用可能になったらユーザー設定を取得
  useEffect(() => {
    if (user?.id && session && !loading) {
      // Googleアバターを即座に設定
      const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
      if (googleAvatarUrl) {
        setUserIconUrl(googleAvatarUrl)
      }
      
      // ユーザー設定を取得（初回セットアップの確認）
      refreshUserSettings()
    }
  }, [user?.id, session, loading, user?.user_metadata?.avatar_url, user?.user_metadata?.picture, refreshUserSettings])

  // カスタムイベントでユーザー設定の更新を監視
  useEffect(() => {
    const handleUserSettingsUpdate = () => {
      if (user?.id && session && !loading) {
        refreshUserSettings()
      }
    }

    window.addEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    
    return () => {
      window.removeEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    }
  }, [user?.id, session, loading, refreshUserSettings])

  const refreshUser = async () => {
    try {
      const { data: { user: refreshedUser }, error } = await supabase.auth.getUser()
      if (refreshedUser && !error) {
        setUser(refreshedUser)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        // セッション更新に失敗した場合、現在のセッションを取得
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
        }
        return
      }
      
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
      }
    } catch (error) {
      console.error('Failed to refresh session:', error)
    }
  }

  const clearSettingsRedirect = () => {
    setShouldRedirectToSettings(false)
  }

  const value = {
    user,
    session,
    loading,
    userIconUrl,
    isUserSetupComplete,
    shouldRedirectToSettings,
    signOut,
    signInWithGoogle,
    updateUserMetadata,
    refreshUser,
    refreshUserSettings,
    refreshSession,
    clearSettingsRedirect,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
