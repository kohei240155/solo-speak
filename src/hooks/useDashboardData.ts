import { useState, useEffect, useCallback } from 'react'
import { api } from '@/utils/api'

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

      const dashboardData = await api.get<DashboardData>(`/api/dashboard?language=${encodeURIComponent(language)}`)
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
