'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { api } from '@/utils/api'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  userIconUrl: string | null
  isUserSetupComplete: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  updateUserMetadata: (metadata: Record<string, string>) => Promise<void>
  refreshUser: () => Promise<void>
  refreshUserSettings: () => Promise<void>
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

  useEffect(() => {
    // タイムアウト設定（5秒後に強制的にローディング解除）
    const loadingTimeout = setTimeout(() => {
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
          // エラー時はローカル認証情報をクリア（サーバー通信なしで）
          try {
            await supabase.auth.signOut()
          } catch {
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
      } catch {
        // 例外時はローカル認証情報をクリア（サーバー通信なしで）
        try {
          await supabase.auth.signOut()
        } catch {
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
        } catch {
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
    } catch {
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
      throw error
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
        headers: {
          'Cache-Control': 'no-cache',
        },
        timeout: 10000
      })
      
      setIsUserSetupComplete(true)
      
      // 画像URLの有効性をチェック
      if (userData.iconUrl && typeof userData.iconUrl === 'string' && userData.iconUrl.trim() !== '') {
        setUserIconUrl(userData.iconUrl)
        return
      }
      
      // DBにアイコンURLがない場合、現在の値を保持（Googleアバターなど）
      setUserIconUrl(prev => {
        if (prev && (prev.includes('googleusercontent.com') || 
                    prev.includes('googleapis.com') || 
                    prev.includes('google.com'))) {
          return prev // Googleアバターを保持
        }
        return null
      })
    } catch (error) {
      // 404エラーの場合は初回ログイン時
      if (error instanceof Error && error.message.includes('404')) {
        setIsUserSetupComplete(false)
        
        // Googleアバターがある場合は自動的に表示
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                               googleAvatarUrl.includes('googleapis.com') || 
                               googleAvatarUrl.includes('google.com'))) {
          setUserIconUrl(googleAvatarUrl)
          return
        }
        
        setUserIconUrl(null)
        return
      }
      
      // タイムアウトエラーまたはネットワークエラーの場合
      if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('timeout'))) {
        // タイムアウト時の処理（ログなし）
      }
      
      setIsUserSetupComplete(false)
      // エラー時は現在のアイコンを保持
      setUserIconUrl(prev => {
        if (prev && (prev.includes('googleusercontent.com') || 
                    prev.includes('googleapis.com') || 
                    prev.includes('google.com'))) {
          return prev
        }
        return null
      })
    }
  }, [user?.id, session, user?.user_metadata?.avatar_url, user?.user_metadata?.picture])

  // ユーザーとセッションが利用可能になったらユーザー設定を取得
  useEffect(() => {
    if (user?.id && session && !loading) {
      // Googleアバターがある場合は即座に設定（一度だけ）
      const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
      if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                             googleAvatarUrl.includes('googleapis.com') || 
                             googleAvatarUrl.includes('google.com'))) {
        setUserIconUrl(prev => prev || googleAvatarUrl) // 既にセットされている場合は更新しない
      }
      
      // その後でAPIから正式な設定を取得（初回のみ）
      if (!isUserSetupComplete) {
        refreshUserSettings()
      }
    }
  }, [user?.id, session, loading, isUserSetupComplete, user?.user_metadata?.avatar_url, user?.user_metadata?.picture, refreshUserSettings])

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
    } catch {
      // エラー時は何もしない
    }
  }

  const value = {
    user,
    session,
    loading,
    userIconUrl,
    isUserSetupComplete,
    signOut,
    signInWithGoogle,
    updateUserMetadata,
    refreshUser,
    refreshUserSettings,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
