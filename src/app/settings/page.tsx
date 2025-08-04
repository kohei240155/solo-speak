'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/auth/useAuthGuard'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSetupSchema, UserSetupFormData } from '@/types/userSettings'
import { useUserSettings } from '@/hooks/data/useUserSettings'
import UserSettingsForm from '@/components/settings/UserSettingsForm'
import SubscriptionTab from '@/components/settings/SubscriptionTab'
import TabNavigation from '@/components/navigation/TabNavigation'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function UserSettingsPage() {
  const { loading: authLoading } = useAuthGuard()
  const [activeTab, setActiveTab] = useState<'user' | 'subscription'>('user')

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
      email: ''
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

  if (authLoading || dataLoading) {
    return <LoadingSpinner withHeaderOffset message="Loading..." />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
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
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
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
              submitting={false}
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
