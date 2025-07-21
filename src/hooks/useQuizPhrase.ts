import { useState, useCallback } from 'react'
import { QuizConfig, QuizPhrase, QuizSession } from '@/types/quiz'
import { supabase } from '@/utils/spabase'
import toast from 'react-hot-toast'

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
  const [session, setSession] = useState<QuizSession | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  const currentPhrase = session ? session.phrases[session.currentIndex] : null

  const fetchQuizSession = useCallback(async (config: QuizConfig): Promise<boolean> => {
    setIsLoadingPhrase(true)
    setShowTranslation(false)
    
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      
      if (!authSession) {
        toast.error('認証情報が見つかりません。再度ログインしてください。')
        return false
      }

      const params = new URLSearchParams({
        language: config.language,
        mode: config.mode,
        count: (config.questionCount || 10).toString()
      })

      console.log('Quiz API request:', {
        language: config.language,
        mode: config.mode,
        count: config.questionCount || 10
      })

      const response = await fetch(`/api/phrase/quiz?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      })
      
      const data = await response.json()
      console.log('Quiz API response:', data)

      if (data.success && data.phrases && data.phrases.length > 0) {
        const newSession: QuizSession = {
          phrases: data.phrases,
          currentIndex: 0,
          totalCount: data.totalCount,
          availablePhraseCount: data.availablePhraseCount || data.phrases.length
        }
        setSession(newSession)
        console.log('Quiz session created successfully:', newSession)
        return true
      } else {
        const errorMessage = data.message || 'フレーズが見つかりませんでした'
        console.error('Quiz API failed:', data)
        toast.error(errorMessage)
        return false
      }
    } catch (error) {
      console.error('Error fetching quiz session:', error)
      toast.error('フレーズの取得中にエラーが発生しました')
      return false
    } finally {
      setIsLoadingPhrase(false)
    }
  }, [])

  const handleShowTranslation = useCallback(() => {
    setShowTranslation(true)
  }, [])

  const handleAnswer = useCallback(async (isCorrect: boolean) => {
    if (!currentPhrase || !session) return

    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      
      if (!authSession) {
        toast.error('認証情報が見つかりません。')
        return
      }

      // 回答をサーバーに送信
      await fetch('/api/phrase/quiz/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          phraseId: currentPhrase.id,
          isCorrect
        })
      })

    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error('回答の送信中にエラーが発生しました')
    }
  }, [currentPhrase, session])

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
