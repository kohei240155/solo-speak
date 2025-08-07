import { useState, useCallback, useEffect } from 'react'
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
  // モーダルで選択された設定を保持するステート
  const [savedConfig, setSavedConfig] = useState<SpeakConfig | null>(null)

  // ページ読み込み時にURLパラメータから設定を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const language = params.get('language')
    const excludeIfSpeakCountGTE = params.get('excludeIfSpeakCountGTE')
    const excludeTodayPracticed = params.get('excludeTodayPracticed')
    
    if (language) {
      const restoredConfig: SpeakConfig = {
        language,
        excludeIfSpeakCountGTE: excludeIfSpeakCountGTE && excludeIfSpeakCountGTE !== '' ? parseInt(excludeIfSpeakCountGTE, 10) : undefined,
        excludeTodayPracticed: excludeTodayPracticed === 'true'
      }
      setSavedConfig(restoredConfig)
    }
  }, [])

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
    // 最初の呼び出し時に設定を保存（Start時）
    if (!savedConfig) {
      setSavedConfig(config)
      
      // URLパラメータに設定を保存
      const params = new URLSearchParams(window.location.search)
      
      params.set('language', config.language)
      
      if (config.excludeIfSpeakCountGTE !== undefined) {
        params.set('excludeIfSpeakCountGTE', config.excludeIfSpeakCountGTE.toString())
      } else {
        params.set('excludeIfSpeakCountGTE', '')
      }
      
      const excludeTodayPracticedValue = (config.excludeTodayPracticed ?? true).toString()
      params.set('excludeTodayPracticed', excludeTodayPracticedValue)
      
      // URLを更新（ページリロードは発生しない）
      const newUrl = `${window.location.pathname}?${params.toString()}`
      window.history.replaceState({}, '', newUrl)
    }
    
    // 保存された設定を使用（Next時は保存された設定を優先）
    const configToUse = savedConfig || config
    
    setIsLoadingPhrase(true)
    try {
      const params = new URLSearchParams({
        language: configToUse.language,
        excludeTodayPracticed: (configToUse.excludeTodayPracticed ?? true).toString()
      })

      // excludeIfSpeakCountGTEパラメータを追加（オプションなので条件分岐）
      if (configToUse.excludeIfSpeakCountGTE !== undefined) {
        params.append('excludeIfSpeakCountGTE', configToUse.excludeIfSpeakCountGTE.toString())
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
  }, [savedConfig, setSavedConfig, updateCountButtonState, t])

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
      // カウントが0でもsession_spokenをtrueに設定（統一されたcount APIを使用）
      try {
        await api.post(`/api/phrase/${currentPhrase.id}/count`, { count: 0 })
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
      // カウントが0でもsession_spokenをtrueに設定（統一されたcount APIを使用）
      try {
        await api.post(`/api/phrase/${currentPhrase.id}/count`, { count: 0 })
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
    setSavedConfig(null) // 保存された設定もリセット
    
    // URLパラメータもクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [currentPhrase, pendingCount, sendPendingCount, t])

  // 日付変更の検出（UTC基準）- Speak練習用
  useEffect(() => {
    let currentUTCDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式
    
    const checkDateChange = () => {
      const newUTCDate = new Date().toISOString().split('T')[0]
      if (newUTCDate !== currentUTCDate) {
        currentUTCDate = newUTCDate
        // 日付が変わったら現在のフレーズの情報を再取得
        if (currentPhrase && savedConfig) {
          fetchSpeakPhrase(savedConfig)
        }
      }
    }
    
    // 1分ごとに日付変更をチェック
    const interval = setInterval(checkDateChange, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [currentPhrase, savedConfig, fetchSpeakPhrase])

  // 設定リセット用の関数（URLパラメータもクリア）
  const resetSavedConfig = useCallback(() => {
    setSavedConfig(null)
    // URLパラメータもクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [])

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
    handleFinish,
    resetSavedConfig
  }
}
