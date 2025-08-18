'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { UserSettingsResponse } from '@/types/userSettings'
import { getStoredDisplayLanguage, setStoredDisplayLanguage } from '@/contexts/LanguageContext'
import { isUILanguage } from '@/constants/languages'
import LoginModal from '@/components/auth/LoginModal'
import { useUserSettings } from '@/hooks/auth/useUserSettings'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  userSettings: UserSettingsResponse | null
  userSettingsLoading: boolean
  userIconUrl: string | null
  isUserSetupComplete: boolean
  shouldRedirectToSettings: boolean
  isLoginModalOpen: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  updateUserMetadata: (metadata: Record<string, string>) => Promise<void>
  refreshUser: () => Promise<void>
  refreshUserSettings: () => Promise<void>
  refreshSession: () => Promise<void>
  clearSettingsRedirect: () => void
  showLoginModal: () => void
  hideLoginModal: () => void
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  // SWRを使用してユーザー設定を取得
  const { 
    userSettings, 
    isLoading: userSettingsLoading, 
    refresh: refreshUserSettings 
  } = useUserSettings(user?.id ?? null)

  useEffect(() => {
    // 現在のセッションを取得
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch {
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (!session?.user) {
          // ログアウト時の状態リセット
          setUserIconUrl(null)
          setIsUserSetupComplete(false)
          setIsLoginModalOpen(false)
        } else {
          // ログイン成功時
          setIsLoginModalOpen(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      // Supabaseからログアウト（状態は onAuthStateChange で自動更新される）
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      // ログアウト完了後にホームページへリダイレクト
      router.push('/')
    }
  }

  const signInWithGoogle = async () => {
    try {
      // 環境変数から適切なベースURLを取得
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.com'
      const redirectUrl = `${baseUrl}/auth/callback`

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })
      
      // OAuth認証が正常に開始されたかログで確認
      if (data?.url) {
        // 明示的にOAuth URLに遷移（ブラウザによってはこれが必要）
        window.location.href = data.url
      } else if (!error) {
        // OAuth started but no URL was returned
      }
      
      return { error }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('認証処理でエラーが発生しました')
      return { error: error as AuthError }
    }
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

  // ユーザー設定データの取得
  const fetchUserSettings = useCallback(async () => {
    if (!user?.id) return null
    
    try {
      return await mutate(
        ['/api/user/settings', user.id],
        api.get<UserSettingsResponse>('/api/user/settings', {
          showErrorToast: false
        })
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        // 初回ユーザーの場合は自動作成
        await api.post('/api/user/init', {}, { showErrorToast: false })
        return null
      }
      throw error
    }
  }, [user?.id])

  // ユーザーアイコンの設定
  const updateUserIcon = useCallback((userData: UserSettingsResponse | null) => {
    if (userData?.iconUrl?.trim()) {
      setUserIconUrl(userData.iconUrl)
    } else {
      // Googleアバターをフォールバック
      const googleAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
      setUserIconUrl(googleAvatarUrl || null)
    }
  }, [user?.user_metadata])

  // 表示言語の自動設定
  const updateDisplayLanguage = useCallback((userData: UserSettingsResponse) => {
    if (!userData.nativeLanguage?.code) return
    
    const nativeLanguageCode = userData.nativeLanguage.code
    const targetLanguage = isUILanguage(nativeLanguageCode) ? nativeLanguageCode : 'en'
    const currentDisplayLanguage = getStoredDisplayLanguage()
    
    if (currentDisplayLanguage !== targetLanguage) {
      setStoredDisplayLanguage(targetLanguage)
      window.dispatchEvent(new CustomEvent('displayLanguageChanged', { 
        detail: { locale: targetLanguage } 
      }))
    }
  }, [])

  // 設定完了判定
  const checkSetupComplete = useCallback((userData: UserSettingsResponse | null) => {
    if (!userData) return false
    
    return !!(
      userData.username?.trim() &&
      userData.nativeLanguageId &&
      userData.defaultLearningLanguageId
    )
  }, [])

  const refreshUserSettings = useCallback(async () => {
    if (!user?.id || !session) {
      setIsUserSetupComplete(false)
      setUserIconUrl(null)
      setUserSettings(null)
      setUserSettingsLoading(false)
      return
    }

    setUserSettingsLoading(true)
    try {
      const userData = await fetchUserSettings()
      
      setUserSettings(userData ?? null)
      updateUserIcon(userData ?? null)
      
      const isComplete = checkSetupComplete(userData ?? null)
      setIsUserSetupComplete(isComplete)
      setShouldRedirectToSettings(!isComplete)
      
      if (isComplete && userData) {
        updateDisplayLanguage(userData)
      }
    } catch (error) {
      console.error('Failed to refresh user settings:', error)
      setUserSettings(null)
      setIsUserSetupComplete(false)
      setShouldRedirectToSettings(true)
      updateUserIcon(null)
    } finally {
      setUserSettingsLoading(false)
    }
  }, [user?.id, session, fetchUserSettings, updateUserIcon, checkSetupComplete, updateDisplayLanguage])

  // ユーザーとセッションが利用可能になったらユーザー設定を取得
  useEffect(() => {
    if (user?.id && session && !loading) {
      refreshUserSettings()
    }
  }, [user?.id, session, loading, refreshUserSettings])

  // ユーザー設定更新イベントの監視
  useEffect(() => {
    const handleUserSettingsUpdate = () => {
      if (user?.id && session && !loading) {
        mutate(['/api/user/settings', user.id])
        refreshUserSettings()
      }
    }

    window.addEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    
    return () => {
      window.removeEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    }
  }, [user?.id, session, loading, refreshUserSettings])

  const refreshUser = async () => {
    const { data: { user: refreshedUser }, error } = await supabase.auth.getUser()
    if (refreshedUser && !error) {
      setUser(refreshedUser)
    }
  }

  const refreshSession = async () => {
    const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
    
    if (newSession && !error) {
      setSession(newSession)
      setUser(newSession.user)
    }
  }

  const clearSettingsRedirect = () => {
    setShouldRedirectToSettings(false)
  }

  const showLoginModal = () => {
    setIsLoginModalOpen(true)
  }

  const hideLoginModal = () => {
    setIsLoginModalOpen(false)
  }

  const value = {
    user,
    session,
    loading,
    userSettings,
    userSettingsLoading,
    userIconUrl,
    isUserSetupComplete,
    shouldRedirectToSettings,
    isLoginModalOpen,
    signOut,
    signInWithGoogle,
    updateUserMetadata,
    refreshUser,
    refreshUserSettings,
    refreshSession,
    clearSettingsRedirect,
    showLoginModal,
    hideLoginModal,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      <LoginModal isOpen={isLoginModalOpen} onClose={hideLoginModal} />
    </AuthContext.Provider>
  )
}
