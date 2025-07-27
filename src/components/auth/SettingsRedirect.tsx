'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export const SettingsRedirect = () => {
  const router = useRouter()
  const { shouldRedirectToSettings, clearSettingsRedirect } = useAuth()

  useEffect(() => {
    console.log('SettingsRedirect - shouldRedirectToSettings:', shouldRedirectToSettings)
    if (shouldRedirectToSettings) {
      console.log('Redirecting to settings page for initial setup')
      clearSettingsRedirect()
      router.push('/settings')
    }
  }, [shouldRedirectToSettings, clearSettingsRedirect, router])

  return null // このコンポーネントは何もレンダリングしません
}
