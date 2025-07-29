// フレーズ生成API用の型定義

export interface GeneratePhraseRequestBody {
  nativeLanguage: string
  learningLanguage: string
  desiredPhrase: string
  useChatGptApi?: boolean
  selectedContext?: string
}

export interface PhraseVariation {
  text: string
  explanation?: string
}

export interface GeneratePhraseResponseData {
  variations: PhraseVariation[]
}
