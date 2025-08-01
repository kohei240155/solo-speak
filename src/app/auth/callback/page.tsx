'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { api, ApiError } from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

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
          
          try {
            // ユーザーが既に設定済みかチェック（404エラーでトーストを表示しない）
            await api.get('/api/user/settings', {
              showErrorToast: false
            })
            
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
            
            // ユーザーが設定済みの場合はフレーズリストページへ
            window.location.href = `${redirectUrl}/phrase/list`
          } catch (apiError) {
            // 404エラー（ユーザー未設定）またはその他のエラー
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
            
            const is404Error = (
              (apiError instanceof ApiError && apiError.status === 404) ||
              (apiError instanceof Error && apiError.message.includes('404'))
            )
            
            if (is404Error) {
              // ユーザーが未設定の場合は設定画面へ直接遷移
              console.log('Initial user setup required - redirecting to settings')
              window.location.href = `${redirectUrl}/settings`
            } else {
              // その他のエラー - とりあえずフレーズリストページへ
              console.error('API呼び出しエラー:', apiError)
              window.location.href = `${redirectUrl}/phrase/list`
            }
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
