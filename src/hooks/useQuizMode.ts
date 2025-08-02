import { useState, useCallback, useEffect } from 'react'
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

  // ページ読み込み時にURLパラメータから設定を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const language = params.get('language')
    const mode = params.get('mode') as 'normal' | 'random' | null
    const count = params.get('count')
    
    // URLパラメータに設定がある場合、自動的にクイズモードを開始
    if (language && mode && (mode === 'normal' || mode === 'random')) {
      const config: QuizConfig = {
        language,
        mode,
        questionCount: count ? parseInt(count, 10) : 10
      }
      
      setQuizMode({ active: true, config, session: null })
      fetchQuizSession(config)
    }
  }, [fetchQuizSession])

  const handleQuizStart = useCallback(async (config: QuizConfig): Promise<boolean> => {
    // URLパラメータに選択した設定を反映
    const params = new URLSearchParams(window.location.search)
    params.set('language', config.language)
    params.set('mode', config.mode)
    params.set('count', (config.questionCount || 10).toString())
    
    // URLを更新（ページリロードは発生しない）
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
    
    const success = await fetchQuizSession(config)
    
    if (success) {
      setQuizMode({
        active: true,
        config,
        session: null // セッションはuseQuizPhraseで管理
      })
      return true
    } else {
      return false
    }
  }, [fetchQuizSession])

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
