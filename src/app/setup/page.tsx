'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import Header from '@/components/Header'
import Image from 'next/image'

interface Language {
  id: string
  name: string
  code: string
}

export default function UserSetupPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    username: '',
    iconUrl: '',
    nativeLanguageId: '',
    defaultLearningLanguageId: '',
    birthdate: '',
    gender: '',
    email: '',
    defaultQuizCount: 10
  })

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    // 言語一覧を取得
    fetchLanguages()
    
    // ユーザーのメールアドレスを初期値として設定
    if (user.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }))
    }
  }, [user, router])

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/languages')
      if (response.ok) {
        const data = await response.json()
        setLanguages(data)
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 現在のセッションから認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証情報が見つかりません。再度ログインしてください。')
        setLoading(false)
        return
      }

      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'ユーザー設定の保存に失敗しました')
      }
    } catch (error) {
      console.error('Error saving user settings:', error)
      setError('ユーザー設定の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">アカウント設定</h1>
          <p className="text-gray-600 mb-8">
            Solo Speakへようこそ！学習を始める前に、プロフィールを設定しましょう。
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ユーザー名 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                ユーザー名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例：太郎"
              />
            </div>

            {/* プロフィール画像URL */}
            <div>
              <label htmlFor="iconUrl" className="block text-sm font-medium text-gray-700 mb-2">
                プロフィール画像URL
              </label>
              <input
                type="url"
                id="iconUrl"
                name="iconUrl"
                value={formData.iconUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/avatar.jpg"
              />
              {formData.iconUrl && (
                <div className="mt-2">
                  <Image
                    src={formData.iconUrl}
                    alt="プロフィール画像プレビュー"
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                </div>
              )}
            </div>

            {/* 母国語 */}
            <div>
              <label htmlFor="nativeLanguageId" className="block text-sm font-medium text-gray-700 mb-2">
                母国語 <span className="text-red-500">*</span>
              </label>
              <select
                id="nativeLanguageId"
                name="nativeLanguageId"
                value={formData.nativeLanguageId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">言語を選択してください</option>
                {languages.map(lang => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
            </div>

            {/* 学習言語 */}
            <div>
              <label htmlFor="defaultLearningLanguageId" className="block text-sm font-medium text-gray-700 mb-2">
                学習言語 <span className="text-red-500">*</span>
              </label>
              <select
                id="defaultLearningLanguageId"
                name="defaultLearningLanguageId"
                value={formData.defaultLearningLanguageId}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">言語を選択してください</option>
                {languages.map(lang => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>
            </div>

            {/* 誕生日 */}
            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-2">
                誕生日
              </label>
              <input
                type="date"
                id="birthdate"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 性別 */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                性別
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">選択してください</option>
                <option value="MALE">男性</option>
                <option value="FEMALE">女性</option>
                <option value="OTHER">その他</option>
              </select>
            </div>

            {/* メールアドレス */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例：user@example.com"
              />
            </div>

            {/* デフォルトクイズ数 */}
            <div>
              <label htmlFor="defaultQuizCount" className="block text-sm font-medium text-gray-700 mb-2">
                デフォルトクイズ出題数
              </label>
              <select
                id="defaultQuizCount"
                name="defaultQuizCount"
                value={formData.defaultQuizCount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="5">5問</option>
                <option value="10">10問</option>
                <option value="15">15問</option>
                <option value="20">20問</option>
                <option value="25">25問</option>
              </select>
            </div>

            {/* 送信ボタン */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : '設定を保存'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* フッター */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">© 2024 Solo Speak. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
