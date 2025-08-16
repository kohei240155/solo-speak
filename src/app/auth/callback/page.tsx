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
          router.push('/?error=callback_error')
          return
        }

        if (authData.session) {
          // 認証成功時の処理 - 以前のユーザー状態をクリア
          router.push('/phrase/list')
        } else {
          // セッション情報がない場合はホームページへ
          router.push('/')
        }
      } catch {
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
