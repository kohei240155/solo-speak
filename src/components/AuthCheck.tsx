'use client'

import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AuthCheck() {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  // 認証状態に応じて必要な処理があればここに追加
  return null
}
