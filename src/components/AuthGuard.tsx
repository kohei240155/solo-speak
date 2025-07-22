import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface AuthGuardProps {
  user: User | null
  loading: boolean
  children: ReactNode
}

export default function AuthGuard({ user, loading, children }: AuthGuardProps) {
  const router = useRouter()

  // 認証されていない場合の自動リダイレクト
  useEffect(() => {
    if (!loading && !user) {
      // 認証情報がないユーザーは3秒後に自動でTOPページに遷移
      const timer = setTimeout(() => {
        router.push('/')
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">この機能を利用するにはログインが必要です</p>
          <p className="text-gray-500 text-sm mb-4">3秒後に自動でTOPページに移動します</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            今すぐホームに戻る
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
