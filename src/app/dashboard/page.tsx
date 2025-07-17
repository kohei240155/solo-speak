'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/spabase'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [setupCheckLoading, setSetupCheckLoading] = useState(true)

  // ユーザー設定の完了状態をチェック
  const checkUserSetupComplete = useCallback(async () => {
    if (!user) {
      setSetupCheckLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/user/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.status === 404) {
        // ユーザー設定が存在しない場合は設定ページにリダイレクト
        router.push('/setup')
        return
      } else if (!response.ok) {
        console.error('Failed to check user settings:', response.status)
        // エラーの場合も設定ページにリダイレクト
        router.push('/setup')
        return
      }
      
      // ユーザー設定が存在する場合はそのまま継続
      setSetupCheckLoading(false)
    } catch (error) {
      console.error('Error checking user setup:', error)
      router.push('/setup')
    }
  }, [user, router])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      checkUserSetupComplete()
    }
  }, [user, checkUserSetupComplete])

  if (loading || setupCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ダッシュボード
              </h2>
              <p className="text-gray-600 mb-4">
                ようこそ、{user.email}さん！
              </p>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">ユーザー情報</h3>
                <div className="text-left space-y-2">
                  <p><strong>ID:</strong> {user.id}</p>
                  <p><strong>メールアドレス:</strong> {user.email}</p>
                  <p><strong>登録日:</strong> {new Date(user.created_at).toLocaleDateString('ja-JP')}</p>
                  <p><strong>最終ログイン:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ja-JP') : '未設定'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
