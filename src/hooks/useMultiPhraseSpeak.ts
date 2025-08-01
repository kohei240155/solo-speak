import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { speakText } from '@/utils/speechSynthesis'
import toast from 'react-hot-toast'
import { SpeakConfig, SpeakPhrase } from '@/types/speak'

interface SpeakMode {
  active: boolean
  config?: SpeakConfig | null
}

interface UseMultiPhraseSpeakProps {
  currentPhrase: SpeakPhrase | null
  speakMode: SpeakMode
  learningLanguage: string
  handleCount: () => void
  handleNext: (config: SpeakConfig) => Promise<string | boolean | void>
  handleFinish: () => Promise<void>
}

export function useMultiPhraseSpeak({
  currentPhrase,
  speakMode,
  learningLanguage,
  handleCount,
  handleNext,
  handleFinish
}: UseMultiPhraseSpeakProps) {
  const router = useRouter()
  const [isFinishing, setIsFinishing] = useState(false)

  // 音声再生機能
  const handleSound = async () => {
    if (!currentPhrase) return
    
    const languageToUse = speakMode.config?.language || learningLanguage
    await speakText(currentPhrase.original, languageToUse)
  }

  // 次のフレーズを取得（設定付き）
  const handleNextWithConfig = async () => {
    if (speakMode.config) {
      console.log('Calling handleNext with config:', speakMode.config)
      const result = await handleNext(speakMode.config)
      console.log('handleNext result:', result)
      
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
    handleSound,
    handleNextWithConfig,
    handleSpeakFinishComplete,
    handleCount
  }
}
