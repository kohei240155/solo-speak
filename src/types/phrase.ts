export interface PhraseVariation {
  type: 'common' | 'business' | 'casual'
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
  common: 'Common',
  business: 'Business',
  casual: 'Casual'
}

export type TabType = 'List' | 'Add' | 'Speak' | 'Quiz'
