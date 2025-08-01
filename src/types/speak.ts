// Speak練習設定の型定義
export interface SpeakConfig {
  order: 'new-to-old' | 'old-to-new'
  language: string
  prioritizeLowPractice: boolean
}

// 練習用フレーズの型定義
export interface SpeakPhrase {
  id: string
  original: string
  translation: string
  totalSpeakCount: number
  dailySpeakCount: number
}

// Speak練習モードの状態型
export interface SpeakModeState {
  active: boolean
  config: SpeakConfig | null
}
