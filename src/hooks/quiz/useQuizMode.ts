import { useState, useCallback, useEffect } from 'react'
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

  // ページ読み込み時にURLパラメータから設定を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const language = params.get('language')
    const mode = params.get('mode') as 'normal' | 'random' | null
    const count = params.get('count')
    const speakCountFilter = params.get('speakCountFilter')
    
    // URLパラメータに設定がある場合、自動的にクイズモードを開始
    if (language && mode && (mode === 'normal' || mode === 'random')) {
      // speakCountFilterの安全な解析
      let parsedSpeakCountFilter: number | null = null
      if (speakCountFilter && speakCountFilter !== 'null') {
        const parsed = parseInt(speakCountFilter, 10)
        if (!isNaN(parsed)) {
          parsedSpeakCountFilter = parsed
        }
      }

      const config: QuizConfig = {
        language,
        mode,
        questionCount: count ? parseInt(count, 10) : 10,
        speakCountFilter: parsedSpeakCountFilter
      }
      
      setQuizMode({ active: true, config, session: null })
      
      // キャッシュからフレーズを取得してセッション作成
      const phrases = getQuizPhrases(config)
      if (phrases && phrases.length > 0) {
        createQuizSession(phrases)
      }
    }
  }, [createQuizSession, getQuizPhrases])

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
