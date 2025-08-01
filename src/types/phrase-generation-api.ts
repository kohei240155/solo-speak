// フレーズ生成API用の型定義

export interface GeneratePhraseRequestBody {
  nativeLanguage: string
  learningLanguage: string
  desiredPhrase: string
  selectedContext?: string
}

export interface PhraseVariation {
  text: string
  explanation?: string
}

export interface GeneratePhraseResponseData {
  variations: PhraseVariation[]
}
