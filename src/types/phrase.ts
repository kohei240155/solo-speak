import { LanguageInfo } from './common'

export interface PhraseVariation {
  type: 'common' | 'business' | 'casual'
  text: string
  explanation?: string
}

// 再エクスポート（後方互換性のため）
export type Language = LanguageInfo

export interface SavedPhrase {
  id: string
  text: string
  translation: string
  nuance?: string
  createdAt: string
  practiceCount: number
  correctAnswers: number
  language: {
    name: string
    code: string
  }
}

export const typeLabels = {
  common: 'Common',
  business: 'Business',
  casual: 'Casual'
}

export type TabType = 'List' | 'Add' | 'Speak' | 'Quiz'
