'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50">
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
