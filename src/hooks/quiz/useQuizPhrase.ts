import { useState, useCallback } from 'react'
import { QuizConfig, QuizPhrase, QuizSession } from '@/types/quiz'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'

interface UseQuizPhraseReturn {
  session: QuizSession | null
  currentPhrase: QuizPhrase | null
  isLoadingPhrase: boolean
  showTranslation: boolean
  fetchQuizSession: (config: QuizConfig) => Promise<boolean>
  handleShowTranslation: () => void
  handleAnswer: (isCorrect: boolean) => Promise<void>
  handleNext: () => void
  resetQuiz: () => void
}

export function useQuizPhrase(): UseQuizPhraseReturn {
  const { t } = useTranslation()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const currentPhrase = session ? session.phrases[session.currentIndex] : null

  const fetchQuizSession = useCallback(async (config: QuizConfig): Promise<boolean> => {
    setIsLoadingPhrase(true)
    setShowTranslation(false)
    
    try {
      const params = new URLSearchParams({
        language: config.language,
        mode: config.mode,
        count: (config.questionCount || 10).toString()
      })

      const data = await api.get<{ success: boolean, phrases?: QuizPhrase[], message?: string, totalCount?: number, availablePhraseCount?: number }>(`/api/phrase/quiz?${params.toString()}`)

      if (data.success && data.phrases && data.phrases.length > 0) {
        const newSession: QuizSession = {
          phrases: data.phrases,
          currentIndex: 0,
          totalCount: data.totalCount || 0,
          availablePhraseCount: data.availablePhraseCount || data.phrases.length
        }
        setSession(newSession)
        return true
      } else {
        const errorMessage = data.message || t('phrase.messages.notFound')
        toast.error(errorMessage)
        return false
      }
    } catch {
      toast.error(t('quiz.messages.fetchError'))
      return false
    } finally {
      setIsLoadingPhrase(false)
    }
  }, [t])

  const handleShowTranslation = useCallback(() => {
    setShowTranslation(true)
  }, [])

  const handleAnswer = useCallback(async (isCorrect: boolean) => {
    if (!currentPhrase || !session) return

    try {
      // 回答をサーバーに送信
      await api.post('/api/phrase/quiz/answer', {
        phraseId: currentPhrase.id,
        isCorrect
      })

    } catch {
      toast.error(t('quiz.messages.submitError'))
    }
  }, [currentPhrase, session, t])

  const handleNext = useCallback(() => {
    if (!session) return

    setShowTranslation(false)
    
    setSession(prevSession => {
      if (!prevSession || prevSession.currentIndex >= prevSession.totalCount - 1) {
        return prevSession
      }
      return {
        ...prevSession,
        currentIndex: prevSession.currentIndex + 1
      }
    })
  }, [session])

  const resetQuiz = useCallback(() => {
    setSession(null)
    setShowTranslation(false)
  }, [])

  return {
    session,
    currentPhrase,
    isLoadingPhrase,
    showTranslation,
    fetchQuizSession,
    handleShowTranslation,
    handleAnswer,
    handleNext,
    resetQuiz
  }
}
