'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/utils/spabase'

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
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null)
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)

  useEffect(() => {
    // 現在のセッションを取得
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // ユーザー状態が変更されたらアイコンURLもリセット
        if (!session?.user) {
          setUserIconUrl(null)
          setIsUserSetupComplete(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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
      
      // その後でAPIから正式な設定を取得
      refreshUserSettings()
    }
  }, [user?.id, session, loading, user?.user_metadata?.avatar_url, user?.user_metadata?.picture]) // eslint-disable-line react-hooks/exhaustive-deps

  // カスタムイベントでユーザー設定の更新を監視
  useEffect(() => {
    const handleUserSettingsUpdate = () => {
      if (user?.id && session) {
        refreshUserSettings()
      }
    }

    window.addEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    
    return () => {
      window.removeEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    }
  }, [user?.id, session]) // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    // ローカル状態をクリア
    setUser(null)
    setSession(null)
    setUserIconUrl(null)
    setIsUserSetupComplete(false)
    
    // Supabaseからのログアウト
    await supabase.auth.signOut()
    
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
      const response = await fetch('/api/user/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache', // キャッシュを無効化
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setIsUserSetupComplete(true)
        
        // 画像URLの有効性をチェック
        if (userData.iconUrl && typeof userData.iconUrl === 'string' && userData.iconUrl.trim() !== '') {
          setUserIconUrl(userData.iconUrl)
        } else {
          // DBにアイコンURLがない場合、現在の値を保持（Googleアバターなど）
          setUserIconUrl(prev => {
            if (prev && (prev.includes('googleusercontent.com') || 
                        prev.includes('googleapis.com') || 
                        prev.includes('google.com'))) {
              return prev // Googleアバターを保持
            }
            return null
          })
        }
      } else if (response.status === 404) {
        // 初回ログイン時：Googleアイコンを自動設定
        setIsUserSetupComplete(false)
        
        // Googleアバターがある場合は自動的に表示
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                               googleAvatarUrl.includes('googleapis.com') || 
                               googleAvatarUrl.includes('google.com'))) {
          setUserIconUrl(googleAvatarUrl)
        } else {
          setUserIconUrl(null)
        }
      } else {
        setIsUserSetupComplete(false)
        setUserIconUrl(null)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
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
