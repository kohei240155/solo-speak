import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { SpeakConfig } from '@/types/speak'
import { useTranslation } from '@/hooks/ui/useTranslation'

interface SpeakMode {
  active: boolean
  config?: SpeakConfig | null
}

interface UseMultiPhraseSpeakProps {
  speakMode: SpeakMode
  handleCount: () => void
  handleNext: (config: SpeakConfig) => Promise<string | boolean | void>
  handleFinish: () => Promise<void>
}

export function useMultiPhraseSpeak({
  speakMode,
  handleCount,
  handleNext,
  handleFinish
}: UseMultiPhraseSpeakProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [isFinishing, setIsFinishing] = useState(false)
  const [isNextLoading, setIsNextLoading] = useState(false)

  // 次のフレーズを取得（設定付き）
  const handleNextWithConfig = useCallback(async () => {
    if (speakMode.config) {
      // URLパラメータから最新の設定を取得してAPIリクエストに使用
      const params = new URLSearchParams(window.location.search)
      const currentConfig: SpeakConfig = {
        order: (params.get('order') as 'new-to-old' | 'old-to-new') || speakMode.config.order,
        language: params.get('language') || speakMode.config.language,
        excludeIfSpeakCountGTE: params.get('excludeIfSpeakCountGTE') ? 
          parseInt(params.get('excludeIfSpeakCountGTE')!, 10) : 
          speakMode.config.excludeIfSpeakCountGTE,
        excludeTodayPracticed: params.get('excludeTodayPracticed') ? 
          params.get('excludeTodayPracticed') === 'true' : 
          speakMode.config.excludeTodayPracticed
      }
      
      // デバッグ用ログ - Next時の設定確認
      console.log('useMultiPhraseSpeak - handleNextWithConfig currentConfig from URL:', {
        excludeTodayPracticed: currentConfig.excludeTodayPracticed,
        excludeIfSpeakCountGTE: currentConfig.excludeIfSpeakCountGTE,
        order: currentConfig.order,
        language: currentConfig.language
      })
      
      setIsNextLoading(true)
      try {
        const result = await handleNext(currentConfig)
        return result
      } finally {
        setIsNextLoading(false)
      }
    }
  }, [speakMode.config, handleNext])

  // 練習終了処理
  const handleSpeakFinishComplete = useCallback(async () => {
    setIsFinishing(true)
    try {
      await handleFinish()
      // 練習準備画面ではなく、直接Listページに遷移
      router.push('/phrase/list')
    } catch {
      toast.error(t('speak.messages.endError'))
    } finally {
      setIsFinishing(false)
    }
  }, [handleFinish, router, t])

  return {
    isFinishing,
    isNextLoading,
    handleNextWithConfig,
    handleSpeakFinishComplete,
    handleCount
  }
}
