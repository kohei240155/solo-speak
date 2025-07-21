// Quiz機能の型定義
export interface QuizConfig {
  mode: 'normal' | 'random'
  language: string
  questionCount?: number
}

// クイズ用フレーズの型定義
export interface QuizPhrase {
  id: string
  text: string
  translation: string
  languageCode: string
  correctQuizCount: number
}

// クイズセッションの型定義
export interface QuizSession {
  phrases: QuizPhrase[]
  currentIndex: number
  totalCount: number
  availablePhraseCount: number // 登録されているフレーズの総数
}

// クイズモードの状態型
export interface QuizModeState {
  active: boolean
  config: QuizConfig | null
  session: QuizSession | null
}
