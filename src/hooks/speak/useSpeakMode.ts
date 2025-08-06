import { useState, useEffect, useCallback } from 'react'
import { SpeakConfig, SpeakModeState } from '@/types/speak'

interface UseSpeakModeOptions {
  learningLanguage: string
  fetchSpeakPhrase: (config: SpeakConfig) => Promise<boolean | 'allDone'>
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
    config: null
  })

  // ページ読み込み時にURLパラメータから設定を復元
  useEffect(() => {
    if (!learningLanguage) return

    const params = new URLSearchParams(window.location.search)
    const order = params.get('order') as 'new-to-old' | 'old-to-new' | null
    const urlLanguage = params.get('language')
    const excludeIfSpeakCountGTE = params.get('excludeIfSpeakCountGTE')
    const excludeTodayPracticed = params.get('excludeTodayPracticed')
    
    // URLパラメータに設定がある場合、自動的に練習モードを開始
    if (order && (order === 'new-to-old' || order === 'old-to-new')) {
      const config: SpeakConfig = {
        order,
        language: urlLanguage || learningLanguage,
        excludeIfSpeakCountGTE: excludeIfSpeakCountGTE && excludeIfSpeakCountGTE !== '' ? parseInt(excludeIfSpeakCountGTE, 10) : undefined,
        excludeTodayPracticed: excludeTodayPracticed === 'true'
      }
      setSpeakMode({ active: true, config })
      fetchSpeakPhrase(config)
    }
  }, [learningLanguage, fetchSpeakPhrase])

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
  const handleSpeakStart = useCallback(async (config: SpeakConfig) => {
    setSpeakMode({ active: true, config })
    
    // URLパラメータに選択した設定を反映
    const params = new URLSearchParams(window.location.search)
    params.set('order', config.order)
    params.set('language', config.language)
    
    // excludeIfSpeakCountGTEパラメータを追加
    if (config.excludeIfSpeakCountGTE !== undefined) {
      params.set('excludeIfSpeakCountGTE', config.excludeIfSpeakCountGTE.toString())
    } else {
      // undefinedの場合は空文字ではなくパラメータ自体を削除
      params.delete('excludeIfSpeakCountGTE')
    }
    
    // excludeTodayPracticedパラメータを追加
    params.set('excludeTodayPracticed', (config.excludeTodayPracticed ?? false).toString())
    
    // URLを更新（ページリロードは発生しない）
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
    
    // フレーズを取得
    const result = await fetchSpeakPhrase(config)
    
    // All Done状態の場合はfalseを返して、SpeakModalでAll Done画面を表示させる
    if (result === 'allDone') {
      return false
    }
    
    return result
  }, [fetchSpeakPhrase])

  // 練習終了時の処理
  const handleSpeakFinish = useCallback(() => {
    setSpeakMode({ active: false, config: null })
    
    // URLパラメータをクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [])

  return {
    speakMode,
    handleSpeakStart,
    handleSpeakFinish
  }
}
