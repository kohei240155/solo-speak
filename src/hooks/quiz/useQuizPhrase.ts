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
  handleHideTranslation: () => void
  handleAnswer: (isCorrect: boolean) => Promise<void>
  handleNext: () => void
  handleSpeakCount: (phraseId: string, count: number) => Promise<void>
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

      // 音読回数フィルターがある場合は追加
      if (config.speakCountFilter !== null && config.speakCountFilter !== undefined) {
        params.append('speakCountFilter', config.speakCountFilter.toString())
      }

      // 今日出題済み除外オプションを必ず追加（true/falseに関わらず）
      params.append('excludeTodayQuizzed', config.excludeTodayQuizzed ? 'true' : 'false')

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

  const handleSpeakCount = useCallback(async (phraseId: string, count: number) => {
    try {
      // 指定された回数分音読回数を加算
      await api.post(`/api/phrase/${phraseId}/count`, { count })
      
      // セッション内のフレーズのカウント更新は行わない
      // UI側で pendingSpeakCount として表示されるため、ここでの更新は不要
      
    } catch {
      toast.error(t('speak.messages.countError'))
    }
  }, [t])

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
    handleHideTranslation,
    handleAnswer,
    handleNext,
    handleSpeakCount,
    resetQuiz
  }
}
