import { useState, useCallback } from 'react'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'
import { SpeakPhrase, SpeakConfig } from '@/types/speak'
import { useTranslation } from '@/hooks/ui/useTranslation'

export const useSpeakPhrase = () => {
  const { t } = useTranslation()
  const [currentPhrase, setCurrentPhrase] = useState<SpeakPhrase | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [isCountDisabled, setIsCountDisabled] = useState(false)

  // 今日のカウントに基づいてCountボタンの状態を更新
  const updateCountButtonState = useCallback((actualTodayCount: number) => {
    setIsCountDisabled(actualTodayCount >= 100)
  }, [])

  // カウントをサーバーに送信する関数
  const sendPendingCount = useCallback(async (phraseId: string, countToSend: number): Promise<boolean> => {
    if (countToSend === 0) return true // 送信するカウントがない場合は成功として扱う

    try {
      await api.post(`/api/phrase/${phraseId}/count`, { count: countToSend })
      return true
    } catch (error: unknown) {
      console.error('Error sending count:', error)
      toast.error(t('phrase.messages.countError'))
      return false
    }
  }, [t])

  // フレーズを取得する関数
  const fetchSpeakPhrase = useCallback(async (config: SpeakConfig): Promise<boolean | 'allDone'> => {
    setIsLoadingPhrase(true)
    try {
      const params = new URLSearchParams({
        language: config.language,
        order: config.order.replace('-', '_'), // new-to-old → new_to_old
      })

      // excludeIfSpeakCountGTEパラメータを追加
      if (config.excludeIfSpeakCountGTE !== undefined) {
        params.append('excludeIfSpeakCountGTE', config.excludeIfSpeakCountGTE.toString())
      }

      const data = await api.get<{ success: boolean, phrase?: SpeakPhrase, message?: string, allDone?: boolean, dailyLimitReached?: boolean }>(`/api/phrase/speak?${params.toString()}`)

      if (data.success && data.phrase) {
        setCurrentPhrase(data.phrase)
        setTodayCount(data.phrase.dailySpeakCount || 0)
        setTotalCount(data.phrase.totalSpeakCount || 0)
        setPendingCount(0) // 新しいフレーズ取得時はペンディングカウントをリセット
        updateCountButtonState(data.phrase.dailySpeakCount || 0)
        return true
      } else {
        // フレーズが取得できない場合は常にAll Done状態として扱う
        return 'allDone'
      }
    } catch (error) {
      console.error('Error fetching speak phrase:', error)
      toast.error(t('phrase.messages.fetchError'))
      return false
    } finally {
      setIsLoadingPhrase(false)
    }
  }, [updateCountButtonState, t])

  // カウント機能（ローカルでのみカウントを増加）
  const handleCount = useCallback(async () => {
    if (!currentPhrase) return

    // ローカル状態のみを更新（APIは呼ばない）
    const newPendingCount = pendingCount + 1
    setPendingCount(newPendingCount)
    
    const newTodayCount = todayCount + 1
    setTodayCount(newTodayCount)
    setTotalCount(prev => prev + 1)
    
    // フレーズの表示カウントは更新しない（todayCountを表示に使用するため）
    setCurrentPhrase(prev => prev ? {
      ...prev,
      totalSpeakCount: prev.totalSpeakCount + 1
      // dailySpeakCount は更新しない
    } : null)
    
    // ちょうど100回に達した時にトーストを表示
    if (newTodayCount === 100) {
      toast.error(t('speak.messages.dailyLimitReached'), {
        duration: 4000
      })
    }
    
    // ボタンの状態を更新（表示されているtodayCountと同じ値で判定）
    updateCountButtonState(newTodayCount)
    
  }, [currentPhrase, todayCount, pendingCount, updateCountButtonState, t])

  // 次のフレーズを取得
  const handleNext = useCallback(async (config: SpeakConfig): Promise<boolean | 'allDone'> => {
    if (!currentPhrase) {
      return await fetchSpeakPhrase(config)
    }

    // ペンディングカウントがある場合は送信（session_spokenも自動的にtrueに設定される）
    if (pendingCount > 0) {
      const success = await sendPendingCount(currentPhrase.id, pendingCount)
      if (success) {
        setPendingCount(0) // 送信成功時はペンディングカウントをリセット
      } else {
        toast.error(t('phrase.messages.countError'))
        return false // カウント送信失敗時は次のフレーズを取得しない
      }
    } else {
      // カウントが0でもsession_spokenをtrueに設定
      try {
        await api.post(`/api/phrase/${currentPhrase.id}/session-spoken`)
      } catch (error) {
        console.error('Error setting session spoken:', error)
        // session_spoken設定エラーは次のフレーズ取得を阻害しない
      }
    }

    // 次のフレーズを取得
    const result = await fetchSpeakPhrase(config)
    return result
  }, [currentPhrase, pendingCount, sendPendingCount, fetchSpeakPhrase, t])

  // 練習終了時の処理
  const handleFinish = useCallback(async () => {
    if (!currentPhrase) return

    // ペンディングカウントがある場合は送信（session_spokenも自動的にtrueに設定される）
    if (pendingCount > 0) {
      const success = await sendPendingCount(currentPhrase.id, pendingCount)
      if (!success) {
        toast.error(t('phrase.messages.countError'))
      }
    } else {
      // カウントが0でもsession_spokenをtrueに設定
      try {
        await api.post(`/api/phrase/${currentPhrase.id}/session-spoken`)
      } catch (error) {
        console.error('Error setting session spoken on finish:', error)
        // エラーが発生してもFinish処理は続行
      }
    }

    // 状態をリセット
    setCurrentPhrase(null)
    setTodayCount(0)
    setTotalCount(0)
    setPendingCount(0)
  }, [currentPhrase, pendingCount, sendPendingCount, t])

  return {
    currentPhrase,
    isLoadingPhrase,
    todayCount,
    totalCount,
    pendingCount,
    isCountDisabled,
    fetchSpeakPhrase,
    sendPendingCount,
    handleCount,
    handleNext,
    handleFinish
  }
}
