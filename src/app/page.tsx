'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/Header'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            言語学習を始めましょう
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            フレーズを覚えて、クイズに挑戦し、スピーキング練習で語学力を向上させましょう。
          </p>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              始めるには、右上のログインボタンをクリックしてください
            </p>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              フレーズ学習
            </h3>
            <p className="text-gray-600">
              日常会話で使える実用的なフレーズを学習できます。
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              クイズ機能
            </h3>
            <p className="text-gray-600">
              学習したフレーズの理解度をクイズで確認できます。
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              スピーキング練習
            </h3>
            <p className="text-gray-600">
              音声認識を使って発音練習ができます。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
