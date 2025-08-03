'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { setShowLoginModalRef } from '@/utils/api'

/**
 * AuthContextとAPIクライアントを接続するコンポーネント
 * APIクライアントからログインモーダルを表示できるようにします
 */
export default function AuthApiConnection() {
  const { showLoginModal } = useAuth()

  useEffect(() => {
    // APIクライアントにログインモーダル表示関数を登録
    setShowLoginModalRef(showLoginModal)
    
    // クリーンアップ関数で登録を解除
    return () => {
      setShowLoginModalRef(() => {})
    }
  }, [showLoginModal])

  return null
}
