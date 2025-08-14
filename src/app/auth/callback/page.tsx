'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
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
            // AuthContextのrefreshUserSettingsが自動的にユーザー設定を確認する
            // router.push('/phrase/list')
            
            // ユーザーが設定済みの場合はフレーズリストページへ
            router.push('/phrase/list')
          } catch {
            // エラー時もフレーズリストページに遷移
            router.push('/phrase/list')
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
    <div className="min-h-screen flex justify-center items-start bg-gray-50 pt-28">
      <LoadingSpinner message="Authenticating..." />
    </div>
  )
}
