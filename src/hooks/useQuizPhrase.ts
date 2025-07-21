import { useState, useCallback } from 'react'
import { QuizConfig, QuizPhrase } from '@/types/quiz'
import { supabase } from '@/utils/spabase'
import toast from 'react-hot-toast'

interface UseQuizPhraseReturn {
  currentPhrase: QuizPhrase | null
  isLoadingPhrase: boolean
  fetchQuizPhrase: (config: QuizConfig) => Promise<boolean>
  showResult: boolean
  isCorrect: boolean | null
  selectedAnswer: string | null
  handleAnswer: (selectedAnswer: string, isCorrect: boolean) => void
  handleNext: (config: QuizConfig) => Promise<void>
  resetQuiz: () => void
}

export function useQuizPhrase(): UseQuizPhraseReturn {
  const [currentPhrase, setCurrentPhrase] = useState<QuizPhrase | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)

  const fetchQuizPhrase = useCallback(async (config: QuizConfig): Promise<boolean> => {
    setIsLoadingPhrase(true)
    setShowResult(false)
    setIsCorrect(null)
    setSelectedAnswer(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('認証情報が見つかりません。再度ログインしてください。')
        return false
      }

      const params = new URLSearchParams({
        language: config.language,
        mode: config.mode,
      })

      const response = await fetch(`/api/phrase/quiz?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const data = await response.json()

      if (data.success && data.phrase) {
        setCurrentPhrase(data.phrase)
        return true
      } else {
        const errorMessage = data.message || 'フレーズが見つかりませんでした'
        toast.error(errorMessage)
        return false
      }
    } catch (error) {
      console.error('Error fetching quiz phrase:', error)
      toast.error('フレーズの取得中にエラーが発生しました')
      return false
    } finally {
      setIsLoadingPhrase(false)
    }
  }, [])

  const handleAnswer = useCallback((selectedAnswer: string, isCorrect: boolean) => {
    setSelectedAnswer(selectedAnswer)
    setIsCorrect(isCorrect)
    setShowResult(true)
  }, [])

  const handleNext = useCallback(async (config: QuizConfig) => {
    await fetchQuizPhrase(config)
  }, [fetchQuizPhrase])

  const resetQuiz = useCallback(() => {
    setCurrentPhrase(null)
    setShowResult(false)
    setIsCorrect(null)
    setSelectedAnswer(null)
  }, [])

  return {
    currentPhrase,
    isLoadingPhrase,
    fetchQuizPhrase,
    showResult,
    isCorrect,
    selectedAnswer,
    handleAnswer,
    handleNext,
    resetQuiz
  }
}
