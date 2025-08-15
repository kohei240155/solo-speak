'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export const SettingsRedirect = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { shouldRedirectToSettings, clearSettingsRedirect, loading, user } = useAuth()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return

    // ユーザーがいて、Settings画面への遷移フラグが立っている場合
    if (user && shouldRedirectToSettings) {

      // 既にSettings画面にいる場合は遷移せずにフラグだけクリア
      if (pathname === '/settings') {
        clearSettingsRedirect()
        return
      }

      // Settings画面に遷移
      clearSettingsRedirect()
      router.push('/settings')
    }
  }, [shouldRedirectToSettings, user, loading, pathname, router, clearSettingsRedirect])

  return null // このコンポーネントは何もレンダリングしません
}
