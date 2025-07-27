'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  const { shouldRedirectToSettings, clearSettingsRedirect, loading, user } = useAuth()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return

    // ユーザーがいて、Settings画面への遷移フラグが立っている場合
    if (user && shouldRedirectToSettings) {
      // 既にSettings画面にいる場合は遷移しない
      if (pathname === '/settings') {
        clearSettingsRedirect()
        return
      }

      // Settings画面に遷移
      router.push('/settings')
      clearSettingsRedirect()
    }
  }, [shouldRedirectToSettings, user, loading, pathname, router, clearSettingsRedirect])

  return null // このコンポーネントは何もレンダリングしない
}
