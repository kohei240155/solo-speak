'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { api, ApiError } from '@/utils/api'
import { UserSettingsResponse } from '@/types/userSettings'
import { getStoredDisplayLanguage, setStoredDisplayLanguage } from '@/contexts/LanguageContext'
import { isUILanguage } from '@/constants/languages'
import LoginModal from '@/components/auth/LoginModal'
import { mutate } from 'swr'

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
  const [userSettings, setUserSettings] = useState<UserSettingsResponse | null>(null)
  const [userSettingsLoading, setUserSettingsLoading] = useState(false)
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null)
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)
  const [shouldRedirectToSettings, setShouldRedirectToSettings] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

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
          } else {
            // ログイン成功時はログインモーダルを閉じる
            setIsLoginModalOpen(false)
          }
        } catch {
          setSession(null)
          setUser(null)
          setUserIconUrl(null)
          setIsUserSetupComplete(false)
        }
        // finallyブロック外でもsetLoading(false)を必ず呼ぶ
        clearTimeout(loadingTimeout)
        setLoading(false)
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
    setIsLoginModalOpen(false) // ログインモーダルを閉じる
    
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
      // SWRキャッシュを強制更新して最新データを取得
      const userData = await mutate(
        ['/api/user/settings', user.id],
        api.get<UserSettingsResponse>('/api/user/settings', {
          showErrorToast: false
        })
      )
      
      if (!userData) {
        throw new Error('Failed to fetch user settings')
      }
      
      // AuthContextの状態を更新
      setUserSettings(userData)
      
      // ユーザー設定の完了判定：username、nativeLanguageId、defaultLearningLanguageIdが全て設定されている
      const hasRequiredSettings = !!(
        userData.username && 
        userData.username.trim() !== '' &&
        userData.nativeLanguageId &&
        userData.defaultLearningLanguageId
      )
      
      setIsUserSetupComplete(hasRequiredSettings)
      
      // 必須設定が不完全な場合は設定画面にリダイレクト
      if (!hasRequiredSettings) {
        setShouldRedirectToSettings(true)
      } else {
        setShouldRedirectToSettings(false)
        
        // ユーザーの母国語に基づいて表示言語を設定
        if (userData.nativeLanguage?.code) {
          const nativeLanguageCode = userData.nativeLanguage.code
          // UI言語としてサポートされているかチェック
          const targetLanguage = isUILanguage(nativeLanguageCode) 
            ? nativeLanguageCode 
            : 'en' // フォールバック
          
          const currentDisplayLanguage = getStoredDisplayLanguage()
          if (currentDisplayLanguage !== targetLanguage) {
            setStoredDisplayLanguage(targetLanguage)
            
            // LanguageContextに変更を通知
            window.dispatchEvent(new CustomEvent('displayLanguageChanged', { 
              detail: { locale: targetLanguage } 
            }))
          }
        }
      }
      
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
          try {
            // 初回ログイン時にユーザーを自動作成
            await api.post('/api/user/init', {}, { showErrorToast: false })
            
            // 初期化後の状態を設定
            setUserSettings(null)
            setIsUserSetupComplete(false) // まだ設定が完了していない
            setShouldRedirectToSettings(true) // 設定画面にリダイレクト
            
            // 初回ユーザー作成時は設定完了まで表示言語を変更しない
            // （設定完了後に母国語に基づいて設定される）
            
            // Googleアバターがある場合は表示
            const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
            setUserIconUrl(googleAvatarUrl || null)
          } catch {
            setUserSettings(null)
            setIsUserSetupComplete(false)
            setShouldRedirectToSettings(true)
            
            // Googleアバターがある場合は保持
            const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
            setUserIconUrl(googleAvatarUrl || null)
          }
        } else {
        // その他のエラーの場合
        setUserSettings(null)
        setIsUserSetupComplete(false)
        
        // Googleアバターがある場合は保持
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        setUserIconUrl(googleAvatarUrl || null)
      }
    } finally {
      setUserSettingsLoading(false)
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
        // SWRキャッシュも更新
        mutate(['/api/user/settings', user.id])
        refreshUserSettings()
      }
    }

    // 母国語変更時の表示言語更新を監視
    const handleNativeLanguageChanged = (event: CustomEvent) => {
      const { nativeLanguageCode } = event.detail
      if (nativeLanguageCode && isUILanguage(nativeLanguageCode)) {
        const currentDisplayLanguage = getStoredDisplayLanguage()
        if (currentDisplayLanguage !== nativeLanguageCode) {
          setStoredDisplayLanguage(nativeLanguageCode)
          
          // LanguageContextに変更を通知
          window.dispatchEvent(new CustomEvent('displayLanguageChanged', { 
            detail: { locale: nativeLanguageCode } 
          }))
        }
      }
    }

    window.addEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    window.addEventListener('nativeLanguageChanged', handleNativeLanguageChanged as EventListener)
    
    return () => {
      window.removeEventListener('userSettingsUpdated', handleUserSettingsUpdate)
      window.removeEventListener('nativeLanguageChanged', handleNativeLanguageChanged as EventListener)
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

  const refreshSession = async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession()
      
      if (error) {
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
    } catch {
      // Session refresh failed
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
