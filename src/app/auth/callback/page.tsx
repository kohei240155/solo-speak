'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AuthCallback() {
  const router = useRouter()
  const [checkingUserStatus, setCheckingUserStatus] = useState(true)

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
          // 認証成功後、一律Phrase List画面に遷移
          // 短い遅延を入れてAuthContextの処理より後に実行
          setTimeout(() => {
            router.replace('/phrase/list')
          }, 100)
        } else {
          // セッション情報がない場合はホームページへ
          router.push('/')
        }
      } catch {
        router.push('/?error=callback_error')
      } finally {
        setCheckingUserStatus(false)
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 pt-28">
      <LoadingSpinner 
        message={checkingUserStatus ? "Checking user status..." : "Authenticating..."} 
      />
    </div>
  )
}
