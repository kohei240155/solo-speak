'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'

interface EnvironmentInfo {
  NEXT_PUBLIC_SITE_URL?: string
  NEXT_PUBLIC_SUPABASE_URL?: string
  VERCEL_ENV?: string
  NODE_ENV?: string
  deploymentUrl?: string
  currentOrigin?: string
}

export default function DebugPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo>({})

  // 環境変数情報の取得
  useEffect(() => {
    const info: EnvironmentInfo = {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      currentOrigin: window.location.origin,
      deploymentUrl: window.location.host
    }
    setEnvInfo(info)
  }, [])

  // 認証チェック: ログインしていない場合はホームページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  // ローディング中の表示
  if (loading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />
  }

  // 認証されていない場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">環境変数デバッグ情報</h1>
        
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Variables</h2>
          <div className="space-y-2">
            {Object.entries(envInfo).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row">
                <span className="font-mono text-sm text-gray-600 sm:w-64">{key}:</span>
                <span className="font-mono text-sm text-gray-900 break-all">
                  {value || 'undefined'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">推奨される認証リダイレクトURL</h2>
          <div className="bg-gray-100 p-4 rounded">
            <code className="text-sm">
              {process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'}/auth/callback
            </code>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            この URL をSupabaseダッシュボードの「Site URL」および「Redirect URLs」に設定してください。
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
