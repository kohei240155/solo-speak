import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * 認証ガードフック
 * ログインしていないユーザーをホームページにリダイレクトする
 * 
 * @param redirectPath - リダイレクト先のパス（デフォルト: '/'）
 * @returns 認証状態と読み込み状態
 */
export const useAuthGuard = (redirectPath = '/') => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return

    // ユーザーがログインしていない場合、指定されたパスにリダイレクト
    if (!user) {
      router.push(redirectPath)
      return
    }

  }, [user, loading, router, redirectPath])

  return {
    user,
    loading,
    isAuthenticated: !!user && !loading
  }
}
