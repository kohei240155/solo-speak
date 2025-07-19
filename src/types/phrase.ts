export interface PhraseVariation {
  type: 'common' | 'polite' | 'casual'
  text: string
  explanation?: string
}

export interface Language {
  id: string
  name: string
  code: string
}

export interface SavedPhrase {
  id: string
  text: string
  translation: string
  createdAt: string
  practiceCount: number
  correctAnswers: number
  language: {
    name: string
    code: string
  }
}

export const typeLabels = {
  common: '一般的',
  polite: '丁寧',
  casual: 'カジュアル'
}

export const typeIcons = {
  common: '✓',
  polite: '📝',
  casual: '😊'
}

export type TabType = 'List' | 'Add' | 'Speak' | 'Quiz'
