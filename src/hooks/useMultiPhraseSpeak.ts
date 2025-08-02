import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { SpeakConfig } from '@/types/speak'

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
  const router = useRouter()
  const [isFinishing, setIsFinishing] = useState(false)

  // 次のフレーズを取得（設定付き）
  const handleNextWithConfig = async () => {
    if (speakMode.config) {
      const result = await handleNext(speakMode.config)
      
      return result
    }
  }

  // 練習終了処理
  const handleSpeakFinishComplete = async () => {
    setIsFinishing(true)
    try {
      await handleFinish()
      // 練習準備画面ではなく、直接Listページに遷移
      router.push('/phrase/list')
    } catch (error) {
      console.error('Error finishing speak practice:', error)
      toast.error('終了処理中にエラーが発生しました')
    } finally {
      setIsFinishing(false)
    }
  }

  return {
    isFinishing,
    handleNextWithConfig,
    handleSpeakFinishComplete,
    handleCount
  }
}
