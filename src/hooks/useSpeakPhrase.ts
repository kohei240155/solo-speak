import { useState, useCallback } from 'react'
import { supabase } from '@/utils/spabase'
import toast from 'react-hot-toast'
import { SpeakPhrase, SpeakConfig } from '@/types/speak'

export const useSpeakPhrase = () => {
  const [currentPhrase, setCurrentPhrase] = useState<SpeakPhrase | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  // フレーズを取得する関数
  const fetchSpeakPhrase = useCallback(async (config: SpeakConfig) => {
    setIsLoadingPhrase(true)
    try {
      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('認証情報が見つかりません。再度ログインしてください。')
        return false
      }

      const params = new URLSearchParams({
        language: config.language,
        order: config.order.replace('-', '_'), // new-to-old → new_to_old
      })

      const response = await fetch(`/api/phrase/speak?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success && data.phrase) {
        setCurrentPhrase(data.phrase)
        setTodayCount(data.phrase.dailyReadCount || 0)
        setTotalCount(data.phrase.totalReadCount || 0)
        setPendingCount(0) // 新しいフレーズ取得時はペンディングカウントをリセット
        return true
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
      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('No authentication session found')
        return false
      }

      const response = await fetch(`/api/phrase/${phraseId}/count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ count: countToSend })
      })

      return response.ok
    } catch (error) {
      console.error('Error sending count:', error)
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
      totalReadCount: prev.totalReadCount + 1,
      dailyReadCount: prev.dailyReadCount + 1
    } : null)
  }, [currentPhrase])

  // 次のフレーズを取得
  const handleNext = useCallback(async (config: SpeakConfig) => {
    // 保留中のカウントを送信
    if (currentPhrase && pendingCount > 0) {
      const success = await sendPendingCount(currentPhrase.id, pendingCount)
      if (success) {
        setPendingCount(0) // 送信成功時はペンディングカウントをリセット
      } else {
        toast.error('カウントの送信に失敗しました')
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
    handleCount,
    handleNext,
    handleFinish
  }
}
