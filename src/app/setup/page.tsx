'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'

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
    <div className="min-h-screen" style={{ backgroundColor: '#D9D9D9' }}>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-gray-900 mb-6" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '18px' }}>Settings</h1>
          
          {/* タブメニュー */}
          <div className="flex mb-6">
            <button className="flex-1 py-2 bg-gray-200 text-gray-700" style={{ borderRadius: '20px 0 0 20px', fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
              User
            </button>
            <button className="flex-1 py-2 bg-white text-gray-700 border border-l-0 border-gray-300" style={{ borderRadius: '0 20px 20px 0', fontFamily: 'Inter, sans-serif', fontWeight: 'normal', fontSize: '15px' }}>
              Subscription
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Icon */}
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '16px' }}>
                User Icon
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '10px' }}
                >
                  Select
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '10px' }}
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Display Name
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Solo Ichiro"
              />
            </div>

            {/* Native Language */}
            <div>
              <label htmlFor="nativeLanguageId" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Native Language
              </label>
              <div className="relative">
                <select
                  id="nativeLanguageId"
                  name="nativeLanguageId"
                  value={formData.nativeLanguageId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">Select a language</option>
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Default Learning Language */}
            <div>
              <label htmlFor="defaultLearningLanguageId" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Default Learning Language
              </label>
              <div className="relative">
                <select
                  id="defaultLearningLanguageId"
                  name="defaultLearningLanguageId"
                  value={formData.defaultLearningLanguageId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="">Select a language</option>
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="birthdate" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Date of Birth
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Gender
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="MALE"
                    checked={formData.gender === 'MALE'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Male
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="FEMALE"
                    checked={formData.gender === 'FEMALE'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Female
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="OTHER"
                    checked={formData.gender === 'OTHER'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Prefer not to say
                </label>
              </div>
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Contact Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="solospeak@gmail.com"
              />
            </div>

            {/* Default Quiz Length */}
            <div>
              <label htmlFor="defaultQuizCount" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Default Quiz Length
              </label>
              <div className="relative">
                <select
                  id="defaultQuizCount"
                  name="defaultQuizCount"
                  value={formData.defaultQuizCount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#616161' }}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
