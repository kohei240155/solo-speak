'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/utils/spabase'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useUserSettingsData } from '@/hooks/useUserSettingsData'
import LanguageSelector from '@/components/LanguageSelector'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function DashboardClient() {
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
        router.push('/settings')
        return
      } else if (!response.ok) {
        console.error('Failed to check user settings:', response.status)
        router.push('/settings')
        return
      }
      
      setSetupCheckLoading(false)
    } catch (error) {
      console.error('Error checking user setup:', error)
      router.push('/settings')
    }
  }, [user, router])

  // ユーザー認証とセットアップ状態のチェック
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/')
      } else {
        checkUserSetupComplete()
      }
    }
  }, [user, loading, router, checkUserSetupComplete])

  // 選択された言語の設定
  useEffect(() => {
    if (userSettings?.learningLanguage && !selectedLanguage) {
      setSelectedLanguage(userSettings.learningLanguage)
    }
  }, [userSettings, selectedLanguage])

  // ローディング状態の表示
  if (loading || setupCheckLoading) {
    return <LoadingSpinner message="Loading..." />
  }

  if (!user) {
    return null
  }

  if (settingsLoading) {
    return <LoadingSpinner message="Loading settings..." />
  }

  return (
    <div className="space-y-6">
      {/* 言語セレクター */}
      {languages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">学習言語を選択</h2>
          <LanguageSelector
            languages={languages}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            disabled={settingsLoading}
          />
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
      
      {dashboardError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{dashboardError}</p>
        </div>
      )}
    </div>
  )
}
