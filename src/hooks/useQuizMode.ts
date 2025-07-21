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
    console.log('Starting quiz with config:', config)
    
    const success = await fetchQuizSession(config)
    
    if (success) {
      setQuizMode({
        active: true,
        config,
        session: null // セッションはuseQuizPhraseで管理
      })
      console.log('Quiz started successfully')
      return true
    } else {
      console.log('Failed to start quiz')
      return false
    }
  }, [fetchQuizSession])

  const handleQuizFinish = useCallback(() => {
    console.log('Finishing quiz')
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
