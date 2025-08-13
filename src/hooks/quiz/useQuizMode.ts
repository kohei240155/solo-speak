import { useState, useCallback } from 'react'
import { QuizConfig, QuizModeState, QuizPhrase } from '@/types/quiz'

interface UseQuizModeParams {
  createQuizSession: (phrases: QuizPhrase[]) => void
  getQuizPhrases: (config: QuizConfig) => QuizPhrase[] | undefined
}

interface UseQuizModeReturn {
  quizMode: QuizModeState
  handleQuizStart: (config: QuizConfig, phrases?: QuizPhrase[]) => Promise<boolean>
  handleQuizFinish: () => void
}

export function useQuizMode({ createQuizSession, getQuizPhrases }: UseQuizModeParams): UseQuizModeReturn {
  const [quizMode, setQuizMode] = useState<QuizModeState>({
    active: false,
    config: null,
    session: null
  })

  const handleQuizStart = useCallback(async (config: QuizConfig, phrases?: QuizPhrase[]): Promise<boolean> => {
    // URLパラメータに選択した設定を反映
    const params = new URLSearchParams(window.location.search)
    params.set('language', config.language)
    params.set('mode', config.mode)
    params.set('count', (config.questionCount || 10).toString())
    
    // 音読回数フィルターがある場合は追加
    if (config.speakCountFilter !== null && config.speakCountFilter !== undefined) {
      params.set('speakCountFilter', config.speakCountFilter.toString())
    } else {
      params.delete('speakCountFilter')
    }
    
    // URLを更新（ページリロードは発生しない）
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
    
    // フレーズデータを取得（引数で渡されるか、キャッシュから取得）
    const phrasesToUse = phrases || getQuizPhrases(config)
    
    if (phrasesToUse && phrasesToUse.length > 0) {
      setQuizMode({
        active: true,
        config,
        session: null // セッションはuseQuizPhraseで管理
      })
      
      // クイズセッションを作成
      createQuizSession(phrasesToUse)
      return true
    } else {
      return false
    }
  }, [createQuizSession, getQuizPhrases])

  const handleQuizFinish = useCallback(() => {
    setQuizMode({
      active: false,
      config: null,
      session: null
    })
    
    // URLパラメータをクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [])

  return {
    quizMode,
    handleQuizStart,
    handleQuizFinish
  }
}
