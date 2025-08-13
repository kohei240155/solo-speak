import { useState, useCallback } from 'react'
import { QuizConfig, QuizModeState } from '@/types/quiz'

interface UseQuizModeParams {
  fetchQuizSession: (config: QuizConfig) => Promise<boolean>
}

interface UseQuizModeReturn {
  quizMode: QuizModeState
  handleQuizStart: (config: QuizConfig) => Promise<boolean>
  handleQuizFinish: () => void
}

export function useQuizMode({ fetchQuizSession }: UseQuizModeParams): UseQuizModeReturn {
  const [quizMode, setQuizMode] = useState<QuizModeState>({
    active: false,
    config: null,
    session: null
  })

  const handleQuizStart = useCallback(async (config: QuizConfig): Promise<boolean> => {
    const success = await fetchQuizSession(config)
    
    if (success) {
      setQuizMode({
        active: true,
        config,
        session: null
      })
      return true
    }
    
    return false
  }, [fetchQuizSession])

  const handleQuizFinish = useCallback(() => {
    setQuizMode({
      active: false,
      config: null,
      session: null
    })
  }, [])

  return {
    quizMode,
    handleQuizStart,
    handleQuizFinish
  }
}
