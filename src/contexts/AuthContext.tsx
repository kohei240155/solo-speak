'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { UserSettingsResponse } from '@/types/userSettings'
import { LanguageInfo } from '@/types/common'
import { getStoredDisplayLanguage, setStoredDisplayLanguage } from '@/contexts/LanguageContext'
import { isUILanguage } from '@/constants/languages'
import LoginModal from '@/components/auth/LoginModal'
import { useUserSettingsData, useLanguages } from '@/hooks/api/useSWRApi'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  userSettings: UserSettingsResponse | null
  userSettingsLoading: boolean
  userIconUrl: string | null
  isUserSetupComplete: boolean
  isLoginModalOpen: boolean
  languages: LanguageInfo[] | undefined
  languagesLoading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  updateUserMetadata: (metadata: Record<string, string>) => Promise<void>
  refreshUser: () => Promise<void>
  refreshUserSettings: () => void
  refreshSession: () => Promise<void>
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false) // リダイレクト済みフラグ

  // SWRを使用してユーザー設定を取得
  const { 
    userSettings, 
    isLoading: userSettingsLoading, 
    refresh: refreshUserSettings 
  } = useUserSettingsData(user?.id ?? null)

  // SWRを使用して言語リストを取得（認証不要）
  const { 
    languages, 
    isLoading: languagesLoading 
  } = useLanguages()

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
      (event, session) => {
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

  // ユーザー設定が変更されたときの処理
  useEffect(() => {
    if (!userSettings && user?.id) {
      setUserIconUrl(null)
      setIsUserSetupComplete(false)
      return
    }

    if (!userSettings) {
      setUserIconUrl(null)
      setIsUserSetupComplete(false)
      return
    }

    // アイコンの設定
    if (userSettings.iconUrl?.trim()) {
      setUserIconUrl(userSettings.iconUrl)
    } else {
      // Googleアバターをフォールバック
      const googleAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
      setUserIconUrl(googleAvatarUrl || null)
    }

    // 設定完了判定
    const isComplete = !!(
      userSettings.username?.trim() &&
      userSettings.nativeLanguageId &&
      userSettings.defaultLearningLanguageId
    )
    
    setIsUserSetupComplete(isComplete)

    // 表示言語の自動設定（設定完了時のみ）
    if (isComplete && userSettings.nativeLanguage?.code) {
      const nativeLanguageCode = userSettings.nativeLanguage.code
      const targetLanguage = isUILanguage(nativeLanguageCode) ? nativeLanguageCode : 'en'
      const currentDisplayLanguage = getStoredDisplayLanguage()
      
      if (currentDisplayLanguage !== targetLanguage) {
        setStoredDisplayLanguage(targetLanguage)
        window.dispatchEvent(new CustomEvent('displayLanguageChanged', { 
          detail: { locale: targetLanguage, isUserLanguage: true } 
        }))
      }
    }
  }, [userSettings, user?.user_metadata, user?.id])

  // 自動リダイレクトロジック（ログイン後は一律Phrase Listに遷移）
  useEffect(() => {
    if (!user?.id || userSettingsLoading || hasRedirected) return
    
    const currentPath = window.location.pathname
    
    // 認証コールバックページではリダイレクトしない
    if (currentPath === '/auth/callback') {
      return
    }
    
    // ユーザー設定が取得できない場合は処理を待つ
    if (userSettings === undefined) {
      return
    }
    
    // ホームページにいる場合、Phrase Listへ直接リダイレクト
    // PWA環境でuserSettingsがnullでもisUserSetupCompleteがtrueなら安全にリダイレクト
    if (currentPath === '/') {
      setHasRedirected(true)
      router.push('/phrase/list')
      return
    }
    
    // PWA環境でSettings画面に誤ってリダイレクトされた場合の救済措置
    // userSettingsがnullでもisUserSetupCompleteがtrueの場合はPhrase Listにリダイレクト
    if (currentPath === '/settings' && userSettings === null && isUserSetupComplete) {
      setHasRedirected(true)
      router.push('/phrase/list')
      return
    }
  }, [user?.id, userSettings, userSettingsLoading, hasRedirected, isUserSetupComplete, router])

  // ユーザーが変更された時にリダイレクトフラグをリセット
  useEffect(() => {
    setHasRedirected(false)
  }, [user?.id])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      router.push('/')
    }
  }

  const signInWithGoogle = async () => {
    try {
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
      
      if (data?.url) {
        window.location.href = data.url
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
    userSettings: userSettings ?? null,
    userSettingsLoading,
    userIconUrl,
    isUserSetupComplete,
    isLoginModalOpen,
    languages,
    languagesLoading,
    signOut,
    signInWithGoogle,
    updateUserMetadata,
    refreshUser,
    refreshUserSettings,
    refreshSession,
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
