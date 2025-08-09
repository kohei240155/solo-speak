'use client'

// SETTINGS_TABS_DISABLED: useState import を一時的に無効化
// import { useState } from 'react'
import { useAuthGuard } from '@/hooks/auth/useAuthGuard'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSetupSchema, UserSetupFormData } from '@/types/userSettings'
import { useUserSettings } from '@/hooks/data/useUserSettings'
import UserSettingsForm from '@/components/settings/UserSettingsForm'
// SUBSCRIPTION_DISABLED: SubscriptionTab import を一時的に無効化
// import SubscriptionTab from '@/components/settings/SubscriptionTab'
// SETTINGS_TABS_DISABLED: TabNavigation import を一時的に無効化
// import TabNavigation from '@/components/navigation/TabNavigation'
import LoadingSpinner from '@/components/common/LoadingSpinner'
// SUBSCRIPTION_DISABLED: useSearchParams import を一時的に無効化
// import { useSearchParams } from 'next/navigation'

export default function UserSettingsPage() {
  const { loading: authLoading } = useAuthGuard()
  // SUBSCRIPTION_DISABLED: URLパラメータによるタブ切り替えを一時的に無効化
  // const searchParams = useSearchParams()
  // const tabParam = searchParams.get('tab')
  
  // URLパラメータからタブを決定
  // SUBSCRIPTION_DISABLED: subscriptionタブを一時的に無効化し、常にuserタブにリダイレクト
  // const initialTab = (tabParam === 'subscription' || tabParam === 'user') ? tabParam : 'user'
  // SETTINGS_TABS_DISABLED: タブ機能を一時的に無効化
  // const initialTab = 'user' // 常にuserタブに固定
  // const [activeTab, setActiveTab] = useState<'user' | 'subscription'>(initialTab)

  // URLパラメータが変更された時にタブを更新
  // SUBSCRIPTION_DISABLED: subscriptionタブへの遷移を一時的に無効化
  // useEffect(() => {
  //   const tab = searchParams.get('tab')
  //   if (tab === 'subscription' || tab === 'user') {
  //     setActiveTab(tab)
  //   }
  // }, [searchParams])

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
      iconUrl: '/images/user-icon/user-icon.png',
      nativeLanguageId: '',
      defaultLearningLanguageId: '',
      email: ''
    }
  })

  const {
    languages,
    error,
    setError,
    // SETTINGS_TABS_DISABLED: isUserSetupComplete を一時的に無効化
    // isUserSetupComplete,
    setIsUserSetupComplete,
    dataLoading
  } = useUserSettings(setValue)

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex justify-center items-start bg-gray-50 pt-28">
        <LoadingSpinner message="Loading..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
        {/* Settings タイトル */}
        <h1 className="text-gray-900 mb-[18px] text-2xl md:text-3xl font-bold">
          Settings
        </h1>
        
        {/* SETTINGS_TABS_DISABLED: タブメニューを一時的に非表示 */}
        {/* <TabNavigation 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isUserSetupComplete={isUserSetupComplete}
        /> */}

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* SETTINGS_TABS_DISABLED: 常にUserタブの内容を表示 */}
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

          {/* User Tab Content */}
          {/* {activeTab === 'user' && (
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
          )} */}

          {/* SUBSCRIPTION_DISABLED: Subscription Tab Content を一時的に無効化 */}
          {/* {activeTab === 'subscription' && (
            <SubscriptionTab />
          )} */}
        </div>
      </div>
    </div>
  )
}
