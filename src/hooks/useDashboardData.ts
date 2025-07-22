import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/utils/spabase'

interface QuizMasteryLevel {
  level: string
  score: number
  color: string
}

interface DashboardData {
  speakStreak: number
  speakCountToday: number
  speakCountTotal: number
  quizMastery: QuizMasteryLevel[]
}

interface UseDashboardDataReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useDashboardData(language: string): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証が必要です')
        return
      }

      const response = await fetch(`/api/dashboard?language=${encodeURIComponent(language)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'データの取得に失敗しました')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [language])

  useEffect(() => {
    if (language) {
      fetchDashboardData()
    }
  }, [language, fetchDashboardData])

  return {
    data,
    loading,
    error,
    refetch: fetchDashboardData,
  }
}
