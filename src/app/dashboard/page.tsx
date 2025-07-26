'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useUserSettings, useDashboardData, useLanguages } from '@/hooks/useSWRApi'
import LanguageSelector from '@/components/common/LanguageSelector'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [setupCheckLoading, setSetupCheckLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('')

  // SWRを使用してデータを取得
  const { userSettings } = useUserSettings()
  const { dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardData(selectedLanguage)
  const { languages } = useLanguages()

  // ユーザー設定の完了状態をチェック
  const checkUserSetupComplete = useCallback(async () => {
    if (!user) {
      setSetupCheckLoading(false)
      return
    }

    try {
      // SWRのデータが存在する場合は設定完了とみなす
      if (userSettings) {
        setSetupCheckLoading(false)
      } else {
        // 設定が存在しない場合は設定ページにリダイレクト
        router.push('/settings')
      }
    } catch (error) {
      console.error('Error checking user setup:', error)
      router.push('/settings')
    }
  }, [user, router, userSettings])

  useEffect(() => {
    if (user) {
      checkUserSetupComplete()
    }
  }, [user, checkUserSetupComplete])

  // 言語設定の初期化
  useEffect(() => {
    if (userSettings?.defaultLearningLanguage?.code && !selectedLanguage) {
      setSelectedLanguage(userSettings.defaultLearningLanguage.code)
    }
  }, [userSettings, selectedLanguage])

  if (setupCheckLoading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <main className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
        <div className="space-y-6">
          {/* ヘッダー */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            {userSettings && languages && (
              <LanguageSelector
                learningLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                languages={languages || []}
                nativeLanguage={userSettings?.nativeLanguage?.code || ''}
              />
            )}
          </div>

          {/* ダッシュボードエラー */}
          {dashboardError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">エラー: {dashboardError}</p>
            </div>
          )}

          {/* ダッシュボード統計 */}
          {dashboardLoading ? (
            <LoadingSpinner message="Loading data..." className="py-8" />
          ) : dashboardData ? (
            <div className="space-y-6">
              {/* Speak Streak */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Speak Streak</h2>
                <div className="flex items-baseline">
                  <div className="text-6xl font-bold text-gray-900 mr-3">
                    {dashboardData.speakStreak}
                  </div>
                  <div className="text-xl text-gray-600">days</div>
                </div>
              </div>

              {/* Speak Count (Today) */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Speak Count (Today)</h2>
                <div className="text-6xl font-bold text-gray-900">
                  {dashboardData.speakCountToday}
                </div>
              </div>

              {/* Speak Count (Total) */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Speak Count (Total)</h2>
                <div className="text-6xl font-bold text-gray-900">
                  {dashboardData.speakCountTotal}
                </div>
              </div>

              {/* Quiz Mastery */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Mastery</h2>
                <div className="space-y-4">
                  {dashboardData.quizMastery?.map((level: { level: string; score: number; color: string }) => (
                    <div key={level.level} className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-4"
                        style={{ backgroundColor: level.color }}
                      ></div>
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">
                          {level.level}
                        </span>
                        <span className="text-2xl font-bold text-gray-900">
                          {level.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">データがありません</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
