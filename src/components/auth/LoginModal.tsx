'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import BaseModal from '../common/BaseModal'
import LoadingSpinner from '../common/LoadingSpinner'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signInWithGoogle } = useAuth()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError('')

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        setError(error.message)
        setLoading(false)
      }
      // 認証成功時は直接リダイレクトせず、コールバックページに処理を委ねる
    } catch {
      setError('認証に失敗しました。再度お試しください。')
      setLoading(false)
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      {/* ロゴとタイトル */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Image
            src="/images/logo/Solo Speak Logo.png"
            alt="Solo Speak Logo"
            width={200}
            height={60}
            className="h-10 w-auto"
          />
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          Solo Speakでは言えなかったフレーズを言え<br />
          るようにする地道な練習をサポートします。
        </p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Googleログインボタン */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {loading ? (
          <LoadingSpinner 
            size="sm" 
            message="Signing in..." 
            className="flex items-center text-gray-700 [&>div]:border-gray-700 [&>p]:mt-0 [&>p]:ml-3 [&>p]:text-gray-700"
          />
        ) : (
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </div>
        )}
      </button>
    </BaseModal>
  )
}
