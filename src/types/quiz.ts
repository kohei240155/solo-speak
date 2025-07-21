// Quiz機能の型定義
export interface QuizConfig {
  mode: 'normal' | 'random'
  language: string
}

// クイズ用フレーズの型定義
export interface QuizPhrase {
  id: string
  text: string
  translation: string
  options: string[]
  correctAnswer: string
}

// クイズモードの状態型
export interface QuizModeState {
  active: boolean
  config: QuizConfig | null
}
