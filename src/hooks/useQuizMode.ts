import { useState, useCallback } from 'react'
import { QuizConfig } from '@/types/quiz'

interface QuizModeState {
  active: boolean
  config: QuizConfig | null
}

interface UseQuizModeParams {
  fetchQuizPhrase: (config: QuizConfig) => Promise<boolean>
}

interface UseQuizModeReturn {
  quizMode: QuizModeState
  handleQuizStart: (config: QuizConfig) => Promise<boolean>
  handleQuizFinish: () => void
}

export function useQuizMode({ fetchQuizPhrase }: UseQuizModeParams): UseQuizModeReturn {
  const [quizMode, setQuizMode] = useState<QuizModeState>({
    active: false,
    config: null
  })

  const handleQuizStart = useCallback(async (config: QuizConfig): Promise<boolean> => {
    console.log('Starting quiz with config:', config)
    
    const success = await fetchQuizPhrase(config)
    
    if (success) {
      setQuizMode({
        active: true,
        config
      })
      console.log('Quiz started successfully')
      return true
    } else {
      console.log('Failed to start quiz')
      return false
    }
  }, [fetchQuizPhrase])

  const handleQuizFinish = useCallback(() => {
    console.log('Finishing quiz')
    setQuizMode({
      active: false,
      config: null
    })
  }, [])

  return {
    quizMode,
    handleQuizStart,
    handleQuizFinish
  }
}
