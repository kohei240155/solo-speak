import { useState, useCallback } from 'react'
import { QuizConfig } from '@/types/quiz'
import { useRouter } from 'next/navigation'

interface UseQuizModalReturn {
  showQuizModal: boolean
  openQuizModal: () => void
  closeQuizModal: () => void
  handleQuizStart: (config: QuizConfig) => Promise<void>
}

export function useQuizModal(): UseQuizModalReturn {
  const [showQuizModal, setShowQuizModal] = useState(false)
  const router = useRouter()

  const openQuizModal = useCallback(() => {
    setShowQuizModal(true)
  }, [])

  const closeQuizModal = useCallback(() => {
    setShowQuizModal(false)
  }, [])

  const handleQuizStart = useCallback(async (config: QuizConfig) => {
    // 設定に基づいてQuiz画面に遷移
    const queryParams = new URLSearchParams({
      language: config.language,
      mode: config.mode,
      count: (config.questionCount || 10).toString()
    })
    router.push(`/phrase/quiz?${queryParams.toString()}`)
  }, [router])

  return {
    showQuizModal,
    openQuizModal,
    closeQuizModal,
    handleQuizStart
  }
}
