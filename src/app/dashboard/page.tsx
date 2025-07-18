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
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ダッシュボード
            </h2>
            <p className="text-gray-600 mb-4">
              ようこそ、{user.email}さん！
            </p>
          </div>

          {/* 機能メニュー */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div 
              onClick={() => router.push('/phrase-generator')}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI フレーズ生成
                </h3>
                <p className="text-gray-600 text-sm">
                  AIが話したいフレーズを3つのスタイルで提案します
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md opacity-50 cursor-not-allowed border border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  フレーズ学習
                </h3>
                <p className="text-gray-600 text-sm">
                  登録したフレーズを学習します（準備中）
                </p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md opacity-50 cursor-not-allowed border border-gray-200">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  クイズ
                </h3>
                <p className="text-gray-600 text-sm">
                  フレーズの理解度をクイズで確認します（準備中）
                </p>
              </div>
            </div>
          </div>

          {/* ユーザー情報 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">ユーザー情報</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">ID</p>
                <p className="font-mono text-gray-900">{user.id}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">メールアドレス</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">登録日</p>
                <p className="text-gray-900">{new Date(user.created_at).toLocaleDateString('ja-JP')}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">最終ログイン</p>
                <p className="text-gray-900">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('ja-JP') : '未設定'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
