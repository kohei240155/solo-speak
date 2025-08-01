import { useState, useCallback } from 'react'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'
import { SpeakPhrase, SpeakConfig } from '@/types/speak'

export const useSpeakPhrase = () => {
  const [currentPhrase, setCurrentPhrase] = useState<SpeakPhrase | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  // フレーズを取得する関数
  const fetchSpeakPhrase = useCallback(async (config: SpeakConfig): Promise<boolean | 'allCompleted'> => {
    setIsLoadingPhrase(true)
    try {
      const params = new URLSearchParams({
        language: config.language,
        order: config.order.replace('-', '_'), // new-to-old → new_to_old
      })

      // 既にSpeak済みのフレーズを除外する場合
      if (config.excludeSpoken) {
        params.set('excludeSpoken', 'true')
      }

      // 音読回数による除外閾値を設定
      if (config.excludeSpeakCountThreshold && config.excludeSpeakCountThreshold > 0) {
        params.set('excludeSpeakCountThreshold', config.excludeSpeakCountThreshold.toString())
      }

      console.log('useSpeakPhrase - API request params:', params.toString())
      console.log('useSpeakPhrase - config.excludeSpeakCountThreshold:', config.excludeSpeakCountThreshold)

      const data = await api.get<{ 
        success: boolean, 
        phrase?: SpeakPhrase, 
        message?: string,
        allCompleted?: boolean 
      }>(`/api/phrase/speak?${params.toString()}`)

      if (data.success && data.phrase) {
        setCurrentPhrase(data.phrase)
        setTodayCount(data.phrase.dailySpeakCount || 0)
        setTotalCount(data.phrase.totalSpeakCount || 0)
        setPendingCount(0) // 新しいフレーズ取得時はペンディングカウントをリセット
        return true
      } else if (data.allCompleted) {
        // 全てのフレーズが完了した場合は特別な処理
        setCurrentPhrase(null)
        return 'allCompleted'
      } else {
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
  }, [])

  // カウントをサーバーに送信する関数
  const sendPendingCount = useCallback(async (phraseId: string, countToSend: number): Promise<boolean> => {
    if (countToSend === 0) return true // 送信するカウントがない場合は成功として扱う

    try {
      await api.post(`/api/phrase/${phraseId}/count`, { count: countToSend })
      return true
    } catch (error) {
      console.error('Error sending count:', error)
      return false
    }
  }, [])

  // 完了チェック機能
  const checkSpeakCompletion = useCallback(async (language: string): Promise<boolean> => {
    try {
      const data = await api.get<{ 
        success: boolean, 
        allSpoken: boolean, 
        totalCount: number, 
        spokenCount: number 
      }>(`/api/speak/check-completion?language=${language}`)

      if (data.success) {
        return data.allSpoken
      }
      return false
    } catch (error) {
      console.error('Error checking speak completion:', error)
      return false
    }
  }, [])

  // カウント機能（ローカルでのみカウントを増加）
  const handleCount = useCallback(() => {
    if (!currentPhrase) return

    // ローカル状態を即座に更新
    setPendingCount(prev => prev + 1)
    setTodayCount(prev => prev + 1)
    setTotalCount(prev => prev + 1)
    
    // フレーズの表示カウントも更新
    setCurrentPhrase(prev => prev ? {
      ...prev,
      totalSpeakCount: prev.totalSpeakCount + 1,
      dailySpeakCount: prev.dailySpeakCount + 1
    } : null)
  }, [currentPhrase])

  // 次のフレーズを取得
  const handleNext = useCallback(async (config: SpeakConfig): Promise<boolean | 'allCompleted'> => {
    // 現在のフレーズが存在する場合、session_spokenを必ずtrueにする
    if (currentPhrase) {
      if (pendingCount > 0) {
        // カウントがある場合は通常通り送信
        const success = await sendPendingCount(currentPhrase.id, pendingCount)
        if (success) {
          setPendingCount(0) // 送信成功時はペンディングカウントをリセット
        } else {
          toast.error('カウントの送信に失敗しました')
        }
      } else {
        // カウントが0でもsession_spokenをtrueにするためにAPIを呼び出し
        try {
          await api.post(`/api/phrase/${currentPhrase.id}/count`, { count: 0 })
        } catch (error) {
          console.error('Error setting session spoken flag:', error)
          toast.error('セッション状態の更新に失敗しました')
        }
      }
    }

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
    fetchSpeakPhrase,
    sendPendingCount,
    checkSpeakCompletion,
    handleCount,
    handleNext,
    handleFinish
  }
}
