import { useState, useCallback } from 'react'
import { api } from '@/utils/api'
import { markPhraseAsSessionSpoken } from './useApi'
import toast from 'react-hot-toast'
import { SpeakPhrase, SpeakConfig } from '@/types/speak'

export const useSpeakPhrase = () => {
  const [currentPhrase, setCurrentPhrase] = useState<SpeakPhrase | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [isCountDisabled, setIsCountDisabled] = useState(false)

  // 今日のカウントに基づいてCountボタンの状態を更新
  const updateCountButtonState = useCallback((currentTodayCount: number) => {
    setIsCountDisabled(currentTodayCount >= 100)
  }, [])

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
      } else if (data.success && data.allDone) {
        // All Done状態の場合は特別な戻り値を返す
        return 'allDone'
      } else if (data.dailyLimitReached) {
        // 1日の制限に達している場合
        toast.error('このフレーズは1日100回のSpeak制限に到達しました。明日また挑戦してください！', {
          duration: 4000
        })
        setIsCountDisabled(true)
        return false
      } else {
        // 通常のエラーの場合はトーストを表示
        toast.error(data.message || 'フレーズが見つかりませんでした')
        return false
      }
    } catch (error) {
      console.error('Error fetching speak phrase:', error)
      toast.error('フレーズの取得中にエラーが発生しました')
      return false
    } finally {
      setIsLoadingPhrase(false)
    }
  }, [updateCountButtonState])

  // カウントをサーバーに送信する関数
  const sendPendingCount = useCallback(async (phraseId: string, countToSend: number): Promise<boolean> => {
    if (countToSend === 0) return true // 送信するカウントがない場合は成功として扱う

    try {
      await api.post(`/api/phrase/${phraseId}/count`, { count: countToSend })
      return true
    } catch (error: unknown) {
      console.error('Error sending count:', error)
      toast.error('カウントの送信に失敗しました')
      return false
    }
  }, [])

  // カウント機能（ローカルでのみカウントを増加）
  const handleCount = useCallback(async () => {
    if (!currentPhrase) return

    // 制限チェック: 現在の日次カウント + ペンディングカウント + 1 が 100 を超える場合
    const currentDailyCount = (currentPhrase.dailySpeakCount || 0) + pendingCount
    if (currentDailyCount >= 100) {
      toast.error('このフレーズは1日100回のSpeak制限に到達しました。明日また挑戦してください！', {
        duration: 4000
      })
      setIsCountDisabled(true)
      return
    }

    // ローカル状態のみを更新（APIは呼ばない）
    setPendingCount(prev => prev + 1)
    setTodayCount(prev => {
      const newCount = prev + 1
      updateCountButtonState(newCount)
      return newCount
    })
    setTotalCount(prev => prev + 1)
    
    // フレーズの表示カウントも更新
    setCurrentPhrase(prev => prev ? {
      ...prev,
      totalSpeakCount: prev.totalSpeakCount + 1,
      dailySpeakCount: prev.dailySpeakCount + 1
    } : null)
    
  }, [currentPhrase, pendingCount, updateCountButtonState])

  // 次のフレーズを取得
  const handleNext = useCallback(async (config: SpeakConfig): Promise<boolean | 'allDone'> => {
    if (!currentPhrase) {
      return await fetchSpeakPhrase(config)
    }

    try {
      // 1. 保留中のカウントがある場合は送信
      if (pendingCount > 0) {
        const success = await sendPendingCount(currentPhrase.id, pendingCount)
        if (success) {
          setPendingCount(0) // 送信成功時はペンディングカウントをリセット
        } else {
          toast.error('カウントの送信に失敗しました')
        }
      }

      // 2. session_spokenをtrueに設定（カウントが0でも実行）
      await markPhraseAsSessionSpoken(currentPhrase.id)
      
    } catch (error) {
      console.error('Error in handleNext:', error)
      toast.error('処理中にエラーが発生しました')
    }

    // 3. 次のフレーズを取得
    return await fetchSpeakPhrase(config)
  }, [currentPhrase, pendingCount, sendPendingCount, fetchSpeakPhrase])

  // 練習終了時の処理
  const handleFinish = useCallback(async () => {
    // 保留中のカウントを送信
    if (currentPhrase && pendingCount > 0) {
      const success = await sendPendingCount(currentPhrase.id, pendingCount)
      if (!success) {
        toast.error('カウントの送信に失敗しました')
      }
    }

    // 状態をリセット
    setCurrentPhrase(null)
    setTodayCount(0)
    setTotalCount(0)
    setPendingCount(0)
  }, [currentPhrase, pendingCount, sendPendingCount])

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
