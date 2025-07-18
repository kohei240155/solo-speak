'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import ImageUpload, { ImageUploadRef } from '@/components/ImageUpload'
import toast, { Toaster } from 'react-hot-toast'

interface Language {
  id: string
  name: string
  code: string
}

// バリデーションスキーマ
const userSetupSchema = z.object({
  username: z
    .string()
    .min(1, 'Display Name is required')
    .max(100, 'Display Name must be less than 100 characters')
    .trim(),
  iconUrl: z.string().optional(),
  nativeLanguageId: z.string().min(1, 'Native Language is required'),
  defaultLearningLanguageId: z.string().min(1, 'Default Learning Language is required'),
  birthdate: z
    .string()
    .min(1, 'Date of Birth is required')
    .refine((date) => {
      // 空文字列チェック
      if (!date || date.trim() === '') {
        return false
      }
      
      // 日付形式のチェック（YYYY-MM-DD）
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(date)) {
        return false
      }
      
      // 有効な日付かチェック
      const parsedDate = new Date(date)
      const isValidDate = !isNaN(parsedDate.getTime())
      
      return isValidDate
    }, 'Please enter a valid date'),
  gender: z
    .string()
    .min(1, 'Gender is required')
    .refine((val) => ['male', 'female', 'unspecified'].includes(val), {
      message: 'Please select a valid gender option'
    }),
  email: z
    .string()
    .min(1, 'Contact Email is required')
    .email('Please enter a valid email address'),
  defaultQuizCount: z
    .number()
    .min(5, 'Default Quiz Length must be at least 5')
    .max(25, 'Default Quiz Length must be at most 25')
})

type UserSetupFormData = z.infer<typeof userSetupSchema>

export default function UserSetupPage() {
  const { user, loading, updateUserMetadata } = useAuth()
  const router = useRouter()
  const imageUploadRef = useRef<ImageUploadRef>(null)
  const [submitting, setSubmitting] = useState(false)
  const [languages, setLanguages] = useState<Language[]>([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'user' | 'subscription'>('user')
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [userDataLoaded, setUserDataLoaded] = useState(false)
  const [languagesLoaded, setLanguagesLoaded] = useState(false)

  // 認証チェック: ログインしていない場合はログインページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      console.log('User not authenticated, redirecting to login')
      router.push('/auth/login')
    }
  }, [user, loading, router])

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
        setUserDataLoaded(true)
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
        
        // 既存ユーザーの場合は設定完了とみなす
        setIsUserSetupComplete(true)
        
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
        console.log('User not found, this is a new user - setting Google account defaults')
        // 新規ユーザーの場合は設定未完了
        setIsUserSetupComplete(false)
        // Googleアカウントの情報を初期値として設定
        if (user?.user_metadata?.avatar_url) {
          setValue('iconUrl', user.user_metadata.avatar_url)
        }
        if (user?.user_metadata?.full_name) {
          setValue('username', user.user_metadata.full_name)
        }
        if (user?.email) {
          setValue('email', user.email)
        }
      } else {
        console.error('Failed to fetch user settings:', response.status)
        setIsUserSetupComplete(false)
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
      setIsUserSetupComplete(false)
    } finally {
      setUserDataLoaded(true)
    }
  }, [setValue, user, setIsUserSetupComplete])

  const fetchLanguages = useCallback(async () => {
    try {
      console.log('Fetching languages...')
      const response = await fetch('/api/languages')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Languages received:', data)
        
        // フォールバックデータが使用されているかチェック
        const isFallbackData = response.headers.get('X-Fallback-Data') === 'true'
        if (isFallbackData) {
          console.warn('フォールバックデータが使用されています')
          setError('データベースに接続できないため、制限された言語リストを表示しています。')
        }
        
        if (Array.isArray(data) && data.length > 0) {
          setLanguages(data)
          if (!isFallbackData) {
            setError('') // エラーをクリア（フォールバックでない場合のみ）
          }
        } else {
          console.warn('No languages data received:', data)
          setError('言語データが見つかりません。データベースに言語データが登録されていない可能性があります。')
        }
      } else {
        console.error('Failed to fetch languages:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', errorData)
        
        const errorMessage = errorData.details 
          ? `言語データの取得に失敗しました: ${errorData.details}`
          : '言語データの取得に失敗しました。データベース接続を確認してください。'
        
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
      const errorMessage = error instanceof Error 
        ? `言語データの取得に失敗しました: ${error.message}`
        : '言語データの取得に失敗しました。ネットワーク接続を確認してください。'
      
      setError(errorMessage)
    } finally {
      setLanguagesLoaded(true)
    }
  }, [])

  // ユーザー設定とデータの初期化
  useEffect(() => {
    if (user) {
      fetchUserSettings()
      fetchLanguages()
    }
  }, [user, fetchUserSettings, fetchLanguages])

  // データ読み込み完了状態を管理
  useEffect(() => {
    setDataLoading(!(userDataLoaded && languagesLoaded))
  }, [userDataLoaded, languagesLoaded])

  const onSubmit = async (data: UserSetupFormData) => {
    console.log('Setup: Form submit started')
    setSubmitting(true)
    setError('')
    
    console.log('Setup: Form submitted with data:', data)

    try {
      // 現在のセッションから認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証情報が見つかりません。再度ログインしてください。')
        setSubmitting(false)
        return
      }

      const finalData = { ...data }

      // 画像がアップロードされている場合、Supabase Storageにアップロード
      if (imageUploadRef.current && user) {
        try {
          console.log('Setup: Starting image upload for user:', user.id)
          const uploadedUrl = await imageUploadRef.current.uploadImage(user.id)
          if (uploadedUrl) {
            finalData.iconUrl = uploadedUrl
            console.log('Setup: Image uploaded successfully:', uploadedUrl)
          } else {
            console.log('Setup: No image to upload')
          }
        } catch (uploadError) {
          console.error('Setup: Image upload failed:', uploadError)
          
          // RLSエラーの場合はより詳細なエラーメッセージを提供
          if (uploadError instanceof Error) {
            if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
              setError(`画像のアップロード権限がありません。\n解決方法：\n1. Supabase Dashboard > Storage > Settings でRLSを一時的に無効化\n2. または適切なポリシーを設定してください。\n\n詳細: ${uploadError.message}`)
            } else {
              setError(`画像のアップロードに失敗しました: ${uploadError.message}`)
            }
          } else {
            setError('画像のアップロードに失敗しました。')
          }
          
          setSubmitting(false)
          return
        }
      }

      console.log('Session found, making API call...')
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(finalData)
      })

      console.log('API response status:', response.status)
      console.log('API response ok:', response.ok)

      if (response.ok) {
        const responseData = await response.json()
        console.log('API response data:', responseData)
        
        // Supabaseのユーザーメタデータも更新
        if (finalData.iconUrl) {
          await updateUserMetadata({ icon_url: finalData.iconUrl })
        }
        console.log('User setup completed successfully')
        
        // 設定完了状態を更新
        setIsUserSetupComplete(true)
        
        // 成功メッセージを表示
        setError('')
        toast.success('Settings saved successfully!', {
          duration: 3000,
          position: 'top-center',
        })
        
        // Settings画面に留まる（ダッシュボードへのリダイレクトを削除）
      } else {
        console.log('API response not ok, status:', response.status)
        console.log('Response headers:', response.headers)
        
        let errorData
        try {
          const responseText = await response.text()
          console.log('Raw response text:', responseText)
          
          if (responseText) {
            errorData = JSON.parse(responseText)
          } else {
            errorData = { error: 'Empty response from server' }
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { error: 'Invalid response format from server' }
        }
        
        console.error('API Error:', errorData)
        setError(errorData.error || 'ユーザー設定の保存に失敗しました')
      }
    } catch (error) {
      console.error('Error saving user settings:', error)
      setError('ユーザー設定の保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // 認証チェックのuseEffectでリダイレクトされるので、何も表示しない
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <Toaster />
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-4">
        {/* Settings タイトル */}
        <h1 className="text-gray-900 mb-[18px] text-2xl md:text-3xl font-bold">
          Settings
        </h1>
        
        {/* タブメニュー */}
        <div className="flex mb-[18px]">
          <button 
            onClick={() => setActiveTab('user')}
            className={`flex-1 py-2 text-sm md:text-base rounded-l-[20px] ${
              activeTab === 'user' 
                ? 'bg-gray-200 text-gray-700 font-bold' 
                : 'bg-white text-gray-700 border border-gray-300 font-normal'
            }`}
          >
            User
          </button>
          <button 
            onClick={() => {
              // ユーザー設定が完了していない場合はSubscriptionタブに切り替えできない
              if (!isUserSetupComplete) return
              setActiveTab('subscription')
            }}
            className={`flex-1 py-2 text-sm md:text-base rounded-r-[20px] ${
              activeTab === 'subscription' 
                ? 'bg-gray-200 text-gray-700 font-bold' 
                : 'bg-white text-gray-700 border border-l-0 border-gray-300 font-normal'
            }`}
            disabled={!isUserSetupComplete}
          >
            Subscription
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* User Tab Content */}
          {activeTab === 'user' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* User Icon */}
            <div>
              <label className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
                User Icon
              </label>
              <ImageUpload
                ref={imageUploadRef}
                currentImage={watchIconUrl}
                onImageChange={(imageUrl) => {
                  console.log('Setup: onImageChange called with:', imageUrl)
                  setValue('iconUrl', imageUrl)
                }}
                onImageRemove={() => {
                  console.log('Setup: onImageRemove called')
                  setValue('iconUrl', '')
                }}
              />
              {errors.iconUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.iconUrl.message}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
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
              <label htmlFor="nativeLanguageId" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
                Native Language
              </label>
              <div className="relative">
                <select
                  id="nativeLanguageId"
                  {...register('nativeLanguageId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  disabled={!languagesLoaded}
                >
                  <option value="">
                    {!languagesLoaded ? 'Loading languages...' : 'Select a language'}
                  </option>
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  {!languagesLoaded ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                  ) : (
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  )}
                </div>
              </div>
              {errors.nativeLanguageId && (
                <p className="mt-1 text-sm text-red-600">{errors.nativeLanguageId.message}</p>
              )}
            </div>

            {/* Default Learning Language */}
            <div>
              <label htmlFor="defaultLearningLanguageId" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
                Default Learning Language
              </label>
              <div className="relative">
                <select
                  id="defaultLearningLanguageId"
                  {...register('defaultLearningLanguageId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  disabled={!languagesLoaded}
                >
                  <option value="">
                    {!languagesLoaded ? 'Loading languages...' : 'Select a language'}
                  </option>
                  {languages.map(lang => (
                    <option key={lang.id} value={lang.id}>{lang.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  {!languagesLoaded ? (
                    <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                  ) : (
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  )}
                </div>
              </div>
              {errors.defaultLearningLanguageId && (
                <p className="mt-1 text-sm text-red-600">{errors.defaultLearningLanguageId.message}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="birthdate" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
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
              <label className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
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
                  Unspecified
                </label>
              </div>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
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
              <label htmlFor="defaultQuizCount" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
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
                disabled={submitting}
                className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                style={{ backgroundColor: '#616161' }}
                onMouseEnter={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#525252'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting) {
                    e.currentTarget.style.backgroundColor = '#616161'
                  }
                }}
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
          )}

          {/* Subscription Tab Content */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Current Status */}
              <div>
                <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
                  Current Status
                </h2>
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      value="No Subscribe"
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                    />
                  </div>
                  <button
                    type="button"
                    className="px-6 py-2 text-white rounded-md transition-colors duration-200"
                    style={{ backgroundColor: '#616161' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#525252'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#616161'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Plans */}
              <div>
                <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
                  Plans
                </h2>
                <div className="border border-gray-300 rounded-lg p-6">
                  <h3 className="text-gray-900 mb-2 text-xl md:text-2xl font-bold">
                    Basic
                  </h3>
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm md:text-base font-bold">
                      JP ¥ 500 / Month
                    </p>
                    <hr className="mt-2 border-gray-300" />
                  </div>
                  
                  <div className="space-y-2" style={{ marginBottom: '180px' }}>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700">•</span>
                      <span className="text-gray-700 text-xs md:text-sm">
                        1日5回までAIがフレーズを生成
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700">•</span>
                      <span className="text-gray-700 text-xs md:text-sm">
                        音読回数をカウントする機能の提供
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700">•</span>
                      <span className="text-gray-700 text-xs md:text-sm">
                        フレーズの暗記を助けるクイズ機能の提供
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full text-white py-2 px-4 rounded-md transition-colors duration-200"
                    style={{ backgroundColor: '#616161' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#525252'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#616161'
                    }}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
