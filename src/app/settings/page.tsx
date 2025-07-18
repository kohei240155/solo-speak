'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Toaster } from 'react-hot-toast'
import { userSetupSchema, UserSetupFormData } from '@/types/userSettings'
import { useUserSettings } from '@/hooks/useUserSettings'
import { useUserSettingsSubmit } from '@/hooks/useUserSettingsSubmit'
import UserSettingsForm from '@/components/UserSettingsForm'
import SubscriptionTab from '@/components/SubscriptionTab'
import TabNavigation from '@/components/TabNavigation'

export default function UserSettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'user' | 'subscription'>('user')

  // 認証チェック: ログインしていない場合はログインページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

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

  const {
    languages,
    error,
    setError,
    isUserSetupComplete,
    setIsUserSetupComplete,
    dataLoading
  } = useUserSettings(setValue)

  const { onSubmit } = useUserSettingsSubmit(setError, setIsUserSetupComplete)

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
        <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isUserSetupComplete={isUserSetupComplete}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* User Tab Content */}
          {activeTab === 'user' && (
            <UserSettingsForm 
              register={register}
              errors={errors}
              setValue={setValue}
              watch={watch}
              handleSubmit={handleSubmit}
              languages={languages}
              dataLoading={dataLoading}
              setError={setError}
              setIsUserSetupComplete={setIsUserSetupComplete}
              onSubmit={onSubmit}
            />
          )}

          {/* Subscription Tab Content */}
          {activeTab === 'subscription' && (
            <SubscriptionTab />
          )}
        </div>
      </div>
    </div>
  )
}
