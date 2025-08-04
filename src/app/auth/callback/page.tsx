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
          router.push('/?error=callback_error')
          return
        }

        if (authData.session) {
          // 認証成功時の処理 - 以前のユーザー状態をクリア
          
          try {
            // ユーザーが既に設定済みかチェック（404エラーでトーストを表示しない）
            await api.get('/api/user/settings', {
              showErrorToast: false
            })
            
            // ユーザーが設定済みの場合はフレーズリストページへ
            router.push('/phrase/list')
          } catch (apiError) {
            // 404エラー（ユーザー未設定）またはその他のエラー
            
            const is404Error = (
              (apiError instanceof ApiError && apiError.status === 404) ||
              (apiError instanceof Error && apiError.message.includes('404'))
            )
            
            if (is404Error) {
              // ユーザーが未設定の場合は設定画面へ直接遷移
              router.push('/settings')
            } else {
              // その他のエラー - とりあえずフレーズリストページへ
              router.push('/phrase/list')
            }
          }
        } else {
          // セッション情報がない場合はホームページへ
          router.push('/')
        }
      } catch (error) {
        console.error('コールバック処理エラー:', error)
        router.push('/?error=callback_error')
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
