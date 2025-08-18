'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/spabase'
import { api, ApiError } from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function AuthCallback() {
  const router = useRouter()
  const [checkingUserStatus, setCheckingUserStatus] = useState(true)
  const [statusMessage, setStatusMessage] = useState("Authenticating...")

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
          // 認証成功後、ユーザー設定の存在をチェック
          setStatusMessage("Checking user status...")
          
          try {
            // ユーザー設定を取得してユーザーが既に存在するかチェック
            await api.get('/api/user/settings', { showErrorToast: false })
            
            // ユーザー設定が存在する場合はPhrase List画面に遷移
            setTimeout(() => {
              router.replace('/phrase/list')
            }, 100)
          } catch (error: unknown) {
            // 404エラー（ユーザーが存在しない）の場合はSettings画面に遷移
            const is404Error = (
              (error instanceof ApiError && error.status === 404) ||
              (error instanceof Error && (error.message.includes('404') || error.message.includes('User not found')))
            )
            
            if (is404Error) {
              setTimeout(() => {
                router.replace('/settings')
              }, 100)
            } else {
              // その他のエラーの場合はPhrase List画面に遷移（デフォルト動作）
              setTimeout(() => {
                router.replace('/phrase/list')
              }, 100)
            }
          }
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
        message={checkingUserStatus ? statusMessage : "Authenticating..."} 
      />
    </div>
  )
}
