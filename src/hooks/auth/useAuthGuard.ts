import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * 認証ガードフック
 * ログインしていないユーザーをホームページにリダイレクトし、
 * ユーザー設定が未完了の場合はSettings画面にリダイレクトする
 * 
 * @param redirectPath - 未ログイン時のリダイレクト先のパス（デフォルト: '/'）
 * @param requireUserSetup - ユーザー設定完了を必須とするか（デフォルト: true）
 * @returns 認証状態と読み込み状態
 */
export const useAuthGuard = (redirectPath = '/', requireUserSetup = true) => {
  const { user, loading, userSettings, userSettingsLoading, isUserSetupComplete } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading || userSettingsLoading) return

    // ユーザーがログインしていない場合、指定されたパスにリダイレクト
    if (!user) {
      router.push(redirectPath)
      return
    }

    // ユーザー設定が必須で、設定が未完了の場合のみSettings画面にリダイレクト
    // PWA環境での一時的なデータ取得失敗を考慮し、isUserSetupCompleteがfalseの場合のみリダイレクト
    if (requireUserSetup && userSettings === null && !isUserSetupComplete) {
      const currentPath = window.location.pathname
      // 既にSettings画面にいる場合はリダイレクトしない
      if (currentPath !== '/settings') {
        router.push('/settings')
        return
      }
    }

  }, [user, loading, userSettings, userSettingsLoading, isUserSetupComplete, router, redirectPath, requireUserSetup])

  return {
    user,
    loading,
    isAuthenticated: !!user && !loading,
    isUserSetupComplete,
    userSettingsLoading
  }
}
