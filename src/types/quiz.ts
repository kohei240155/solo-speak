// Quiz機能の型定義
export interface QuizConfig {
  mode: 'normal' | 'random'
  language: string
  questionCount?: number
  speakCountFilter?: number | null // 音読回数フィルター（null = 指定なし）
}

// クイズ用フレーズの型定義
export interface QuizPhrase {
  id: string
  original: string
  translation: string
  languageCode: string
  correctQuizCount: number
  totalSpeakCount: number
}

// クイズセッションの型定義
export interface QuizSession {
  phrases: QuizPhrase[]
  currentIndex: number
  totalCount: number
  availablePhraseCount: number // 登録されているフレーズの総数
}

// クイズモードの状態型
// クイズモードの状態管理
export interface QuizModeState {
  active: boolean
  config: QuizConfig | null
  session: QuizSession | null
}

// クイズ回答APIのレスポンス型定義
export interface QuizAnswerResponse {
  success: true
  phrase: {
    id: string
    correctQuizCount: number
    incorrectQuizCount: number
  }
}
