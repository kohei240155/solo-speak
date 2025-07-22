'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/spabase'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserSettingsData } from '@/hooks/useUserSettingsData'
import LanguageSelector from '@/components/LanguageSelector'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [setupCheckLoading, setSetupCheckLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('')

  // ユーザー設定を取得
  const { 
    userSettings, 
    languages, 
    loading: settingsLoading 
  } = useUserSettingsData()

  // ダッシュボードデータを取得
  const { 
    data: dashboardData, 
    loading: dashboardLoading, 
    error: dashboardError 
  } = useDashboardData(selectedLanguage)

  // ユーザー設定の完了状態をチェック
  const checkUserSetupComplete = useCallback(async () => {
    if (!user) {
      setSetupCheckLoading(false)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/login')
        return
      }

      const response = await fetch(`/api/user/settings?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (response.status === 404) {
        // ユーザー設定が存在しない場合は設定ページにリダイレクト
        router.push('/settings')
        return
      } else if (!response.ok) {
        console.error('Failed to check user settings:', response.status)
        // エラーの場合も設定ページにリダイレクト
        router.push('/settings')
        return
      }
      
      // ユーザー設定が存在する場合はそのまま継続
      setSetupCheckLoading(false)
    } catch (error) {
      console.error('Error checking user setup:', error)
      router.push('/settings')
    }
  }, [user, router])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      checkUserSetupComplete()
    }
  }, [user, checkUserSetupComplete])

  // ユーザー設定が読み込まれたらデフォルト言語を設定
  useEffect(() => {
    if (userSettings && !selectedLanguage) {
      setSelectedLanguage(userSettings.defaultLearningLanguage.code)
    }
  }, [userSettings, selectedLanguage])

  if (loading || setupCheckLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
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
                languages={languages}
                nativeLanguage={userSettings.nativeLanguage.code}
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
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">データ読み込み中...</p>
            </div>
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
                  {dashboardData.quizMastery.map((level) => (
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
