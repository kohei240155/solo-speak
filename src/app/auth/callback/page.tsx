'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLパラメータから認証コードを処理
        const { data: authData, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          console.error('認証エラー:', authError)
          const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
          window.location.href = `${redirectUrl}/?error=callback_error`
          return
        }

        if (authData.session) {
          // 認証成功時の処理 - 以前のユーザー状態をクリア
          console.log('New user session detected, clearing previous state')
          
          try {
            // ユーザーが既に設定済みかチェック
            const userCheckResponse = await fetch('/api/user/settings', {
              headers: {
                'Authorization': `Bearer ${authData.session.access_token}`
              }
            })
            
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
            
            if (userCheckResponse.status === 404) {
              // ユーザーが未設定の場合は設定画面へ
              console.log('New user detected, redirecting to settings')
              window.location.href = `${redirectUrl}/settings`
            } else if (userCheckResponse.ok) {
              // ユーザーが設定済みの場合はフレーズリストページへ
              console.log('Existing user detected, redirecting to phrase list')
              window.location.href = `${redirectUrl}/phrase/list`
            } else {
              // その他のエラー - とりあえずフレーズリストページへ
              window.location.href = `${redirectUrl}/phrase/list`
            }
          } catch (apiError) {
            console.error('API呼び出しエラー:', apiError)
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
            window.location.href = `${redirectUrl}/phrase/list`
          }
        } else {
          // セッション情報がない場合はホームページへ
          const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
          window.location.href = redirectUrl
        }
      } catch (error) {
        console.error('コールバック処理エラー:', error)
        const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
        window.location.href = `${redirectUrl}/?error=callback_error`
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <LoadingSpinner 
      fullScreen 
      message="Authenticating..." 
    />
  )
}
