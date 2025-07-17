'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ImageUpload from '@/components/ImageUpload'

interface Language {
  id: string
  name: string
  code: string
}

// バリデーションスキーマ
const userSetupSchema = z.object({
  username: z.string().min(1, 'Display Name is required').max(50, 'Display Name must be less than 50 characters'),
  iconUrl: z.string().optional(),
  nativeLanguageId: z.string().min(1, 'Native Language is required'),
  defaultLearningLanguageId: z.string().min(1, 'Default Learning Language is required'),
  birthdate: z.string().optional(),
  gender: z.enum(['male', 'female', 'unspecified', '']).optional(),
  email: z.string().email('Please enter a valid email address').optional(),
  defaultQuizCount: z.number().min(5).max(25)
})

type UserSetupFormData = z.infer<typeof userSetupSchema>

export default function UserSetupPage() {
  const { user, updateUserMetadata } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')

  // 言語データの変化を監視
  useEffect(() => {
    console.log('Languages state updated:', languages)
  }, [languages])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<UserSetupFormData>({
    resolver: zodResolver(userSetupSchema),
    defaultValues: {
      username: '',
      iconUrl: '',
      nativeLanguageId: '',
      defaultLearningLanguageId: '',
      birthdate: '',
      gender: '',
      email: '',
      defaultQuizCount: 10
    }
  })

  const watchIconUrl = watch('iconUrl')

  const fetchUserSettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('No session found for fetching user settings')
        return
      }

      const response = await fetch('/api/user/settings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        console.log('Existing user data:', userData)
        
        // フォームに既存データを設定
        setValue('username', userData.username || '')
        setValue('iconUrl', userData.iconUrl || '')
        setValue('nativeLanguageId', userData.nativeLanguageId || '')
        setValue('defaultLearningLanguageId', userData.defaultLearningLanguageId || '')
        setValue('birthdate', userData.birthdate ? userData.birthdate.split('T')[0] : '')
        setValue('gender', userData.gender || '')
        setValue('email', userData.email || '')
        setValue('defaultQuizCount', userData.defaultQuizCount || 10)
      } else if (response.status === 404) {
        console.log('User not found, this is a new user')
        // 新規ユーザーの場合は何もしない
      } else {
        console.error('Failed to fetch user settings:', response.status)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }, [setValue])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    // 言語一覧を取得
    fetchLanguages()
    
    // 既存ユーザー情報を取得
    fetchUserSettings()
    
    // ユーザーのメールアドレスを初期値として設定
    if (user.email) {
      setValue('email', user.email)
    }
  }, [user, router, setValue, fetchUserSettings])

  const fetchLanguages = async () => {
    try {
      console.log('Fetching languages...')
      const response = await fetch('/api/languages')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Languages received:', data)
        setLanguages(data)
      } else {
        console.error('Failed to fetch languages:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setError('言語データの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
      setError('言語データの取得に失敗しました')
    }
  }

  const onSubmit = async (data: UserSetupFormData) => {
    setLoading(true)
    setError('')
    
    console.log('Form submitted with data:', data)

    try {
      // 現在のセッションから認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証情報が見つかりません。再度ログインしてください。')
        setLoading(false)
        return
      }

      console.log('Session found, making API call...')
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(data)
      })

      console.log('API response status:', response.status)
      console.log('API response ok:', response.ok)

      if (response.ok) {
        const responseData = await response.json()
        console.log('API response data:', responseData)
        
        // Supabaseのユーザーメタデータも更新
        if (data.iconUrl) {
          await updateUserMetadata({ icon_url: data.iconUrl })
        }
        console.log('User setup completed successfully')
        
        // 成功メッセージを表示してからダッシュボードへリダイレクト
        setError('')
        router.push('/dashboard')
      } else {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError)
          const errorText = await response.text()
          console.error('Error response text:', errorText)
          errorData = { error: 'APIエラーが発生しました' }
        }
        console.error('API Error:', errorData)
        setError(errorData.error || 'ユーザー設定の保存に失敗しました')
      }
    } catch (error) {
      console.error('Error saving user settings:', error)
      setError('ユーザー設定の保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#DFDFDF' }}>
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Icon */}
            <div>
              <label className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '16px' }}>
                User Icon
              </label>
              <ImageUpload
                currentImage={watchIconUrl}
                onImageChange={(imageUrl) => setValue('iconUrl', imageUrl)}
                onImageRemove={() => setValue('iconUrl', '')}
              />
              {errors.iconUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.iconUrl.message}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Display Name
              </label>
              <input
                type="text"
                id="username"
                {...register('username')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Solo Ichiro"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Native Language */}
            <div>
              <label htmlFor="nativeLanguageId" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Native Language
              </label>
              <div className="relative">
                <select
                  id="nativeLanguageId"
                  {...register('nativeLanguageId')}
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
              {errors.nativeLanguageId && (
                <p className="mt-1 text-sm text-red-600">{errors.nativeLanguageId.message}</p>
              )}
            </div>

            {/* Default Learning Language */}
            <div>
              <label htmlFor="defaultLearningLanguageId" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Default Learning Language
              </label>
              <div className="relative">
                <select
                  id="defaultLearningLanguageId"
                  {...register('defaultLearningLanguageId')}
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
              {errors.defaultLearningLanguageId && (
                <p className="mt-1 text-sm text-red-600">{errors.defaultLearningLanguageId.message}</p>
              )}
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
                  {...register('birthdate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
              {errors.birthdate && (
                <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>
              )}
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
                    value="male"
                    {...register('gender')}
                    className="mr-2"
                  />
                  Male
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="female"
                    {...register('gender')}
                    className="mr-2"
                  />
                  Female
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="unspecified"
                    {...register('gender')}
                    className="mr-2"
                  />
                  Prefer not to say
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Contact Email
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="solospeak@gmail.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Default Quiz Length */}
            <div>
              <label htmlFor="defaultQuizCount" className="block text-gray-700 mb-2" style={{ fontFamily: 'Inter, sans-serif', fontWeight: 'bold', fontSize: '15px' }}>
                Default Quiz Length
              </label>
              <div className="relative">
                <select
                  id="defaultQuizCount"
                  {...register('defaultQuizCount', { valueAsNumber: true })}
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
              {errors.defaultQuizCount && (
                <p className="mt-1 text-sm text-red-600">{errors.defaultQuizCount.message}</p>
              )}
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
