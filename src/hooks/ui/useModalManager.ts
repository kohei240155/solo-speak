import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SpeakConfig } from '@/types/speak'
import { QuizConfig } from '@/types/quiz'

interface UseModalManagerProps {
  handleSpeakStart: (config: SpeakConfig) => Promise<boolean>
  setIsSpeakCompleted: (completed: boolean) => void
}

export function useModalManager({ handleSpeakStart, setIsSpeakCompleted }: UseModalManagerProps) {
  const router = useRouter()
  
  const [showSpeakModal, setShowSpeakModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)

  // Speakモーダル開始処理
  const handleSpeakStartWithModal = async (config: SpeakConfig | (SpeakConfig & { allDone: boolean })) => {
    // All Done状態をチェック
    if ('allDone' in config && config.allDone) {
      setIsSpeakCompleted(true)
      return
    }
    
    const success = await handleSpeakStart(config as SpeakConfig)
    if (success) {
      setShowSpeakModal(false)
      // 練習が正常に開始された場合、All Done状態を解除
      setIsSpeakCompleted(false)
    }
  }

  // Quizモーダル開始処理
  const handleQuizStartWithModal = async (config: QuizConfig) => {
    setShowQuizModal(false)
    // 設定に基づいてQuiz画面に遷移
    const queryParams = new URLSearchParams({
      language: config.language,
      mode: config.mode,
      count: (config.questionCount || 10).toString()
    })
    router.push(`/phrase/quiz?${queryParams.toString()}`)
  }

  // Quizモーダルを開く  
  const openQuizModal = () => {
    setShowQuizModal(true)
  }

  // Speakモーダルを開く
  const openSpeakModal = () => {
    setShowSpeakModal(true)
  }

  // モーダルを閉じる
  const closeSpeakModal = () => {
    setShowSpeakModal(false)
  }

  const closeQuizModal = () => {
    setShowQuizModal(false)
  }

  return {
    showSpeakModal,
    showQuizModal,
    openSpeakModal,
    openQuizModal,
    closeSpeakModal,
    closeQuizModal,
    handleSpeakStartWithModal,
    handleQuizStartWithModal
  }
}
