import { getEnglishPrompt } from './en'

// 言語コードと名前のマッピング
export const languageNames = {
  ja: 'Japanese',
  en: 'English',
  ko: 'Korean',
  zh: 'Chinese',
  es: 'Spanish',
  fr: 'French',
  de: 'German'
} as const

// 学習言語ごとのプロンプト取得関数（現在は英語のみ）
const promptGetters = {
  en: getEnglishPrompt,
} as const

/**
 * 学習言語と母国語に基づいてプロンプトテンプレートを取得
 * @param learningLanguage 学習言語のコード（現在は 'en' のみサポート）
 * @param nativeLanguage 母国語のコード（例: 'ja', 'en', 'ko'）
 * @param input ユーザーが入力したフレーズ
 * @param situation シチュエーション（オプション）
 * @returns 完成したプロンプト文字列
 */
export const getPromptTemplate = (learningLanguage: string, nativeLanguage: string, input: string, situation: string | undefined): string => {
  const nativeLanguageName = languageNames[nativeLanguage as keyof typeof languageNames] || nativeLanguage
  
  // 学習言語に対応するプロンプト取得関数を取得
  const promptGetter = promptGetters[learningLanguage as keyof typeof promptGetters]
  
  if (promptGetter) {
    return promptGetter(nativeLanguageName, input, situation)
  }
  
  // 現在は英語のみサポート、その他の言語も英語プロンプトを使用
  return getEnglishPrompt(nativeLanguageName, input, situation)
}
