'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '@/utils/spabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: AuthError | null }>
  updateUserMetadata: (metadata: Record<string, string>) => Promise<void>
  refreshUser: () => Promise<void>
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
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const signInWithGoogle = async () => {
    // 本番環境では明示的に設定されたドメインを使用
    const productionUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
    const redirectUrl = `${productionUrl}/auth/callback`
    
    console.log('Google認証設定:')
    console.log('- リダイレクトURL:', redirectUrl)
    console.log('- 現在のorigin:', window.location.origin)
    console.log('- NODE_ENV:', process.env.NODE_ENV)
    console.log('- VERCEL_ENV:', process.env.VERCEL_ENV)
    
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
    signOut,
    signInWithGoogle,
    updateUserMetadata,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
