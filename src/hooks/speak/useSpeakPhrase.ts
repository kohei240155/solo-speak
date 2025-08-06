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
    const order = params.get('order') as 'new-to-old' | 'old-to-new' | null
    const language = params.get('language')
    const excludeIfSpeakCountGTE = params.get('excludeIfSpeakCountGTE')
    const excludeTodayPracticed = params.get('excludeTodayPracticed')
    
    console.log('useSpeakPhrase - URL params found:', {
      order,
      language,
      excludeIfSpeakCountGTE,
      excludeTodayPracticed,
      excludeTodayPracticedType: typeof excludeTodayPracticed
    })
    
    if (order && language) {
      // excludeTodayPracticedの値を詳細にログ出力
      console.log('useSpeakPhrase - excludeTodayPracticed parsing:', {
        rawValue: excludeTodayPracticed,
        isEqualToTrue: excludeTodayPracticed === 'true',
        isEqualToFalse: excludeTodayPracticed === 'false',
        booleanResult: excludeTodayPracticed === 'true'
      })
      
      const restoredConfig: SpeakConfig = {
        order,
        language,
        excludeIfSpeakCountGTE: excludeIfSpeakCountGTE && excludeIfSpeakCountGTE !== '' ? parseInt(excludeIfSpeakCountGTE, 10) : undefined,
        excludeTodayPracticed: excludeTodayPracticed === 'true' // orderとlanguageと同じように、常に値が存在する前提
      }
      console.log('useSpeakPhrase - Restored config from URL (detailed):', {
        ...restoredConfig,
        excludeTodayPracticedDetailed: {
          value: restoredConfig.excludeTodayPracticed,
          type: typeof restoredConfig.excludeTodayPracticed
        }
      })
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
      console.log('useSpeakPhrase - Received config from modal:', config)
      console.log('useSpeakPhrase - Config types:', {
        orderType: typeof config.order,
        languageType: typeof config.language,
        excludeIfSpeakCountGTEType: typeof config.excludeIfSpeakCountGTE,
        excludeTodayPracticedType: typeof config.excludeTodayPracticed,
        excludeIfSpeakCountGTEValue: config.excludeIfSpeakCountGTE,
        excludeTodayPracticedValue: config.excludeTodayPracticed
      })
      console.log('useSpeakPhrase - Saving config for future use:', {
        order: config.order,
        language: config.language,
        excludeIfSpeakCountGTE: config.excludeIfSpeakCountGTE,
        excludeTodayPracticed: config.excludeTodayPracticed
      })
      setSavedConfig(config)
      
      // URLパラメータに設定を保存
      const params = new URLSearchParams(window.location.search)
      console.log('useSpeakPhrase - Current URL params before update:', params.toString())
      
      params.set('order', config.order)
      params.set('language', config.language)
      
      // orderとlanguageと同じように、常にURLパラメータに設定
      if (config.excludeIfSpeakCountGTE !== undefined) {
        const valueToSet = config.excludeIfSpeakCountGTE.toString()
        params.set('excludeIfSpeakCountGTE', valueToSet)
        console.log('useSpeakPhrase - Setting excludeIfSpeakCountGTE to URL:', config.excludeIfSpeakCountGTE, '→', valueToSet)
      } else {
        params.set('excludeIfSpeakCountGTE', '') // 空文字で設定
        console.log('useSpeakPhrase - Setting excludeIfSpeakCountGTE to empty string')
      }
      
      // excludeTodayPracticedも常に設定（orderとlanguageと同じパターン）
      const excludeTodayPracticedValue = (config.excludeTodayPracticed ?? true).toString()
      params.set('excludeTodayPracticed', excludeTodayPracticedValue)
      console.log('useSpeakPhrase - Setting excludeTodayPracticed to URL:', config.excludeTodayPracticed, '→', excludeTodayPracticedValue)
      
      // URLを更新（ページリロードは発生しない）
      const newUrl = `${window.location.pathname}?${params.toString()}`
      console.log('useSpeakPhrase - Updating URL to:', newUrl)
      console.log('useSpeakPhrase - Final URL params after update:', params.toString())
      
      // 実際にURLの各パラメータを確認
      console.log('useSpeakPhrase - URL param check:', {
        order: params.get('order'),
        language: params.get('language'),
        excludeIfSpeakCountGTE: params.get('excludeIfSpeakCountGTE'),
        excludeTodayPracticed: params.get('excludeTodayPracticed')
      })
      
      window.history.replaceState({}, '', newUrl)
    }
    
    // 保存された設定を使用（Next時は保存された設定を優先）
    const configToUse = savedConfig || config
    console.log('useSpeakPhrase - Config selection:', {
      savedConfig: savedConfig ? {
        ...savedConfig,
        excludeTodayPracticedValue: savedConfig.excludeTodayPracticed,
        excludeTodayPracticedType: typeof savedConfig.excludeTodayPracticed
      } : null,
      passedConfig: {
        ...config,
        excludeTodayPracticedValue: config.excludeTodayPracticed,
        excludeTodayPracticedType: typeof config.excludeTodayPracticed
      },
      finalConfigToUse: {
        ...configToUse,
        excludeTodayPracticedValue: configToUse.excludeTodayPracticed,
        excludeTodayPracticedType: typeof configToUse.excludeTodayPracticed
      }
    })
    
    setIsLoadingPhrase(true)
    try {
      const params = new URLSearchParams({
        language: configToUse.language,
        order: configToUse.order.replaceAll('-', '_'), // new-to-old → new_to_old
        excludeTodayPracticed: (configToUse.excludeTodayPracticed ?? true).toString() // orderとlanguageと同じように常に設定
      })

      // excludeIfSpeakCountGTEパラメータを追加（オプションなので条件分岐）
      if (configToUse.excludeIfSpeakCountGTE !== undefined) {
        params.append('excludeIfSpeakCountGTE', configToUse.excludeIfSpeakCountGTE.toString())
      }

      // デバッグ用ログ - Next押下時の設定確認
      console.log('useSpeakPhrase - fetchSpeakPhrase configToUse:', {
        excludeTodayPracticed: configToUse.excludeTodayPracticed,
        excludeIfSpeakCountGTE: configToUse.excludeIfSpeakCountGTE,
        order: configToUse.order,
        language: configToUse.language
      })
      console.log('useSpeakPhrase - Final URL params:', params.toString())

      const data = await api.get<{ success: boolean, phrase?: SpeakPhrase, message?: string, allDone?: boolean, dailyLimitReached?: boolean }>(`/api/phrase/speak?${params.toString()}`)

      if (data.success && data.phrase) {
        console.log('useSpeakPhrase - Setting todayCount from API:', data.phrase.dailySpeakCount)
        console.log('useSpeakPhrase - Setting totalCount from API:', data.phrase.totalSpeakCount)
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
    setSavedConfig(null) // 保存された設定もリセット
    
    // URLパラメータもクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
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
    handleFinish,
    resetSavedConfig: () => setSavedConfig(null) // 設定リセット用の関数
  }
}
