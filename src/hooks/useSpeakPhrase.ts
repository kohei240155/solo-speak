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
  const updateCountButtonState = useCallback((actualTodayCount: number) => {
    setIsCountDisabled(actualTodayCount >= 100)
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

      console.log('Speak API Response:', data) // レスポンス確認用ログ

      if (data.success && data.phrase) {
        console.log('Found phrase:', data.phrase.original, 'dailySpeakCount:', data.phrase.dailySpeakCount)
        setCurrentPhrase(data.phrase)
        setTodayCount(data.phrase.dailySpeakCount || 0)
        setTotalCount(data.phrase.totalSpeakCount || 0)
        setPendingCount(0) // 新しいフレーズ取得時はペンディングカウントをリセット
        updateCountButtonState(data.phrase.dailySpeakCount || 0)
        return true
      } else if (data.success && data.allDone) {
        // All Done状態の場合は特別な戻り値を返す
        console.log('All Done detected from API response')
        return 'allDone'
      } else if (data.dailyLimitReached) {
        // 1日の制限に達している場合
        console.log('Daily limit reached')
        toast.error('このフレーズは1日100回のSpeak制限に到達しました。明日また挑戦してください！', {
          duration: 4000
        })
        setIsCountDisabled(true)
        return false
      } else {
        // 通常のエラーの場合はトーストを表示
        console.log('No phrase found or error:', data.message)
        
        // フレーズが見つからない場合はAll Done状態の可能性を確認
        if (data.success === false && !data.phrase && !data.message) {
          console.log('No phrases available, treating as All Done')
          return 'allDone'
        }
        
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

    // 制限チェック: todayCount が 100 に達している場合
    if (todayCount >= 100) {
      toast.error('このフレーズは1日100回のSpeak制限に到達しました。明日また挑戦してください！', {
        duration: 4000
      })
      setIsCountDisabled(true)
      return
    }

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
    
    // ボタンの状態を更新（表示されているtodayCountと同じ値で判定）
    updateCountButtonState(newTodayCount)
    
  }, [currentPhrase, todayCount, pendingCount, updateCountButtonState])

  // 次のフレーズを取得
  const handleNext = useCallback(async (config: SpeakConfig): Promise<boolean | 'allDone'> => {
    if (!currentPhrase) {
      console.log('No current phrase, fetching new phrase')
      return await fetchSpeakPhrase(config)
    }

    try {
      // 保留中のカウントがある場合は送信（session_spokenも自動的にtrueに設定される）
      if (pendingCount > 0) {
        console.log('Sending pending count:', pendingCount)
        const success = await sendPendingCount(currentPhrase.id, pendingCount)
        if (success) {
          setPendingCount(0) // 送信成功時はペンディングカウントをリセット
          console.log('Pending count sent successfully and session_spoken set to true')
        } else {
          toast.error('カウントの送信に失敗しました')
          return false // カウント送信失敗時は次のフレーズを取得しない
        }
      } else {
        // カウントが0の場合でもsession_spokenをtrueに設定する必要がある
        console.log('No pending count, but marking phrase as session spoken')
        await markPhraseAsSessionSpoken(currentPhrase.id)
      }
      
    } catch (error) {
      console.error('Error in handleNext:', error)
      toast.error('処理中にエラーが発生しました')
      return false
    }

    // 次のフレーズを取得
    console.log('Fetching next phrase')
    const result = await fetchSpeakPhrase(config)
    console.log('Next phrase fetch result:', result)
    return result
  }, [currentPhrase, pendingCount, sendPendingCount, fetchSpeakPhrase, markPhraseAsSessionSpoken])

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
