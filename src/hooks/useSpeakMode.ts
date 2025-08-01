import { useState, useEffect, useCallback } from 'react'
import { SpeakConfig, SpeakModeState } from '@/types/speak'

interface UseSpeakModeOptions {
  learningLanguage: string
  fetchSpeakPhrase: (config: SpeakConfig) => Promise<boolean | 'allCompleted'>
  currentPhraseId: string | null
  pendingCount: number
  sendPendingCount: (phraseId: string, count: number) => Promise<boolean>
}

export const useSpeakMode = ({
  learningLanguage,
  fetchSpeakPhrase,
  currentPhraseId,
  pendingCount,
  sendPendingCount
}: UseSpeakModeOptions) => {
  const [speakMode, setSpeakMode] = useState<SpeakModeState>({
    active: false,
    config: null,
    spokenPhraseIds: []
  })

  // ページ離脱時に保留中のカウントを送信
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && currentPhraseId && pendingCount > 0) {
        // ページが非表示になる時（タブ切り替えなど）にカウントを送信
        const success = await sendPendingCount(currentPhraseId, pendingCount)
        if (!success) {
          console.warn('Failed to send pending count on visibility change')
        }
      }
    }

    // ページ離脱時の警告
    const handleBeforeUnloadWarning = (event: BeforeUnloadEvent) => {
      if (pendingCount > 0) {
        // 保留中のカウントがある場合は離脱を警告
        event.preventDefault()
        event.returnValue = '保存されていないカウントがあります。本当にページを離れますか？'
        return event.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnloadWarning)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnloadWarning)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentPhraseId, pendingCount, sendPendingCount])

  // 練習開始時の処理
  const handleSpeakStart = useCallback(async (config: SpeakConfig): Promise<boolean | 'allCompleted'> => {
    // スピークしたフレーズIDをリセット（APIでsessionSpokenフラグをリセット）
    try {
      await fetch('/api/speak/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: config.language })
      })
    } catch (error) {
      console.error('Failed to reset session spoken flags:', error)
    }
    
    const updatedConfig = {
      ...config,
      excludeSpoken: false,
      spokenPhraseIds: []
    }
    
    setSpeakMode({ active: true, config: updatedConfig, spokenPhraseIds: [] })
    
    // URLパラメータに選択した設定を反映
    const params = new URLSearchParams(window.location.search)
    params.set('order', config.order)
    params.set('language', config.language)
    
    // 音読回数除外閾値をURLパラメータに追加
    if (config.excludeSpeakCountThreshold && config.excludeSpeakCountThreshold > 0) {
      params.set('excludeSpeakCountThreshold', config.excludeSpeakCountThreshold.toString())
    } else {
      params.delete('excludeSpeakCountThreshold')
    }
    
    // URLを更新（ページリロードは発生しない）
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
    
    // フレーズを取得
    const result = await fetchSpeakPhrase(updatedConfig)
    
    // フレーズの取得に失敗した場合の処理は呼び出し元で行う
    // ここではspeakModeの状態は変更しない
    
    return result
  }, [fetchSpeakPhrase])

  // 次のフレーズ取得時の処理（Speak済みフレーズを除外）
  const getNextPhrase = useCallback(async (currentConfig: SpeakConfig): Promise<boolean | 'allCompleted'> => {
    const updatedConfig = {
      ...currentConfig,
      excludeSpoken: true,
      spokenPhraseIds: [] // データベースのsessionSpokenフラグを使うので不要
    }
    
    return await fetchSpeakPhrase(updatedConfig)
  }, [fetchSpeakPhrase])

  // 練習終了時の処理
  const handleSpeakFinish = useCallback(() => {
    setSpeakMode({ active: false, config: null, spokenPhraseIds: [] })
    
    // URLパラメータをクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [])

  return {
    speakMode,
    handleSpeakStart,
    handleSpeakFinish,
    getNextPhrase
  }
}
