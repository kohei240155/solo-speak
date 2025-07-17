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
        
        // 現在のURLがauth/callbackではない場合は処理をスキップ
        if (!window.location.pathname.includes('/auth/callback')) {
          return
        }
        
        console.log('Auth callback処理開始')
        console.log('- URL:', window.location.href)
        console.log('- Origin:', window.location.origin)
        console.log('- Pathname:', window.location.pathname)
        console.log('- Search params:', window.location.search)
        
        // URLからcode/tokenを取得してセッションを確立
        const { data, error } = await supabase.auth.getSession()
        
        console.log('セッション取得結果:', {
          hasSession: !!data.session,
          hasError: !!error,
          userId: data.session?.user?.id,
          email: data.session?.user?.email
        })
        
        if (error) {
          console.error('認証エラー:', error)
          router.push('/?error=callback_error')
          return
        }

        if (data.session) {
          // 認証成功時の処理
          console.log('認証成功:', data.session.user.email)
          
          try {
            // ユーザーが既に設定済みかチェック
            const userCheckResponse = await fetch('/api/user/settings', {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            })
            
            if (userCheckResponse.status === 404) {
              // ユーザーが未設定の場合は設定画面へ
              console.log('ユーザー未設定、設定画面へリダイレクト')
              router.push('/setup')
            } else if (userCheckResponse.ok) {
              // ユーザーが設定済みの場合はダッシュボードへ
              console.log('ユーザー設定済み、ダッシュボードへリダイレクト')
              router.push('/dashboard')
            } else {
              // その他のエラー - とりあえずダッシュボードへ
              console.warn('ユーザー情報の取得に失敗、ダッシュボードへリダイレクト')
              router.push('/dashboard')
            }
          } catch (apiError) {
            console.error('API呼び出しエラー:', apiError)
            // APIエラーの場合もダッシュボードへリダイレクト
            router.push('/dashboard')
          }
        } else {
          // セッション情報がない場合は再度認証を試行
          const { data: authData, error: authError } = await supabase.auth.getUser()
          
          if (authError) {
            console.error('ユーザー取得エラー:', authError)
            router.push('/?error=user_not_found')
            return
          }

          if (authData.user) {
            router.push('/dashboard')
          } else {
            router.push('/')
          }
        }
      } catch (error) {
        console.error('コールバック処理エラー:', error)
        router.push('/?error=callback_error')
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
