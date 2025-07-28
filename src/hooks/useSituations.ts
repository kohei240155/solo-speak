import { useState, useEffect, useCallback } from 'react'
import { api } from '@/utils/api'
import { SituationResponse } from '@/types/situation'

export interface UseSituationsReturn {
  situations: SituationResponse[]
  isLoading: boolean
  error: string | null
  refetch: () => void
  fetchSituations: () => Promise<void>
  addSituation: (name: string) => Promise<void>
  deleteSituation: (id: string) => Promise<void>
}

/**
 * ユーザーのシチュエーション一覧を管理するフック
 */
export function useSituations(): UseSituationsReturn {
  const [situations, setSituations] = useState<SituationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSituations = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.get<{ situations: SituationResponse[] }>('/api/situations')
      setSituations(data.situations)
    } catch (err) {
      console.error('Failed to fetch situations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch situations')
      setSituations([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addSituation = useCallback(async (name: string) => {
    try {
      const newSituation = await api.post<SituationResponse>('/api/situations', { name })
      setSituations(prev => [newSituation, ...prev])
    } catch (err) {
      console.error('Failed to add situation:', err)
      throw err
    }
  }, [])

  const deleteSituation = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/situations/${id}`)
      setSituations(prev => prev.filter(situation => situation.id !== id))
    } catch (err) {
      console.error('Failed to delete situation:', err)
      throw err
    }
  }, [])

  useEffect(() => {
    fetchSituations()
  }, [fetchSituations])

  return {
    situations,
    isLoading,
    error,
    refetch: fetchSituations,
    fetchSituations,
    addSituation,
    deleteSituation
  }
}
