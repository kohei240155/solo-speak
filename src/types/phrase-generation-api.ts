// フレーズ生成API用の型定義

export interface GeneratePhraseRequestBody {
  nativeLanguage: string
  learningLanguage: string
  desiredPhrase: string
  selectedStyle: 'common' | 'business' | 'casual'
  useChatGptApi?: boolean
}

export interface PhraseVariation {
  type: 'common' | 'business' | 'casual'
  text: string
  explanation?: string
}

export interface GeneratePhraseResponseData {
  variations: PhraseVariation[]
}
