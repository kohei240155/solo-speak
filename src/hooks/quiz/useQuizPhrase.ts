import { useState, useCallback } from 'react'
import { QuizPhrase, QuizSession } from '@/types/quiz'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'

interface UseQuizPhraseReturn {
  session: QuizSession | null
  currentPhrase: QuizPhrase | null
  isLoadingPhrase: boolean
  showTranslation: boolean
  createQuizSession: (phrases: QuizPhrase[]) => void
  handleShowTranslation: () => void
  handleHideTranslation: () => void
  handleAnswer: (isCorrect: boolean) => Promise<void>
  handleNext: () => void
  resetQuiz: () => void
}

export function useQuizPhrase(): UseQuizPhraseReturn {
  const { t } = useTranslation()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [isLoadingPhrase] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const currentPhrase = session ? session.phrases[session.currentIndex] : null

  // SWRキャッシュから取得したフレーズデータでクイズセッションを作成
  const createQuizSession = useCallback((phrases: QuizPhrase[]) => {
    if (!phrases || phrases.length === 0) {
      toast.error(t('phrase.messages.notFound'))
      return
    }

    const newSession: QuizSession = {
      phrases: phrases,
      currentIndex: 0,
      totalCount: phrases.length,
      availablePhraseCount: phrases.length
    }
    
    setSession(newSession)
    setShowTranslation(false)
  }, [t])

  const handleShowTranslation = useCallback(() => {
    setShowTranslation(true)
  }, [])

  const handleHideTranslation = useCallback(() => {
    setShowTranslation(false)
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
    createQuizSession,
    handleShowTranslation,
    handleHideTranslation,
    handleAnswer,
    handleNext,
    resetQuiz
  }
}
