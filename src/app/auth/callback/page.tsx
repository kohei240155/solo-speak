'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { logEnvironmentInfo } from '@/utils/environment'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 環境情報をログ出力
        logEnvironmentInfo()
        
        console.log('Auth callback処理開始')
        console.log('- URL:', window.location.href)
        console.log('- Origin:', window.location.origin)
        console.log('- Pathname:', window.location.pathname)
        console.log('- Search params:', window.location.search)
        
        // URLパラメータから認証コードを処理
        const { data: authData, error: authError } = await supabase.auth.getSession()
        
        if (authError) {
          console.error('認証エラー:', authError)
          // 認証エラー時は適切なドメインにリダイレクト
          const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
          window.location.href = `${redirectUrl}/?error=callback_error`
          return
        }

        if (authData.session) {
          // 認証成功時の処理
          console.log('認証成功:', authData.session.user.email)
          
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
              console.log('ユーザー未設定、設定画面へリダイレクト')
              window.location.href = `${redirectUrl}/setup`
            } else if (userCheckResponse.ok) {
              // ユーザーが設定済みの場合はダッシュボードへ
              console.log('ユーザー設定済み、ダッシュボードへリダイレクト')
              window.location.href = `${redirectUrl}/dashboard`
            } else {
              // その他のエラー - とりあえずダッシュボードへ
              console.warn('ユーザー情報の取得に失敗、ダッシュボードへリダイレクト')
              window.location.href = `${redirectUrl}/dashboard`
            }
          } catch (apiError) {
            console.error('API呼び出しエラー:', apiError)
            // APIエラーの場合もダッシュボードへリダイレクト
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
            window.location.href = `${redirectUrl}/dashboard`
          }
        } else {
          // セッション情報がない場合は再度認証を試行
          const { data: userData, error: userError } = await supabase.auth.getUser()
          
          const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
          
          if (userError) {
            console.error('ユーザー取得エラー:', userError)
            window.location.href = `${redirectUrl}/?error=user_not_found`
            return
          }

          if (userData.user) {
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
            window.location.href = `${redirectUrl}/dashboard`
          } else {
            const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
            window.location.href = redirectUrl
          }
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">認証処理中...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
}
