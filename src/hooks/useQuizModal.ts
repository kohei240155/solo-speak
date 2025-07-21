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
    // Quizページに遷移して開始
    const params = new URLSearchParams({
      language: config.language,
      mode: config.mode,
      autostart: 'true'
    })
    router.push(`/phrase/quiz?${params.toString()}`)
  }, [router])

  return {
    showQuizModal,
    openQuizModal,
    closeQuizModal,
    handleQuizStart
  }
}
