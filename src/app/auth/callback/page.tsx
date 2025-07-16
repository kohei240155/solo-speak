'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLのハッシュからセッション情報を取得
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('認証エラー:', error)
          router.push('/auth/login?error=callback_error')
          return
        }

        if (data.session) {
          // 認証成功時の処理
          console.log('認証成功:', data.session.user.email)
          
          // ユーザーが既に設定済みかチェック
          const userCheckResponse = await fetch('/api/user/settings', {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`
            }
          })
          
          if (userCheckResponse.status === 404) {
            // ユーザーが未設定の場合は設定画面へ
            router.push('/setup')
          } else if (userCheckResponse.ok) {
            // ユーザーが設定済みの場合はダッシュボードへ
            router.push('/dashboard')
          } else {
            // その他のエラー
            console.error('ユーザー情報の取得に失敗しました')
            router.push('/dashboard')
          }
        } else {
          // セッション情報がない場合は再度認証を試行
          const { data: authData, error: authError } = await supabase.auth.getUser()
          
          if (authError) {
            console.error('ユーザー取得エラー:', authError)
            router.push('/auth/login?error=user_not_found')
            return
          }

          if (authData.user) {
            router.push('/dashboard')
          } else {
            router.push('/auth/login')
          }
        }
      } catch (error) {
        console.error('コールバック処理エラー:', error)
        router.push('/auth/login?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-2">認証処理中...</h2>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  )
}
