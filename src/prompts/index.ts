import { getEnglishPrompt } from './en'
import { getKoreanPrompt } from './ko'

// 言語コードと名前のマッピング
export const languageNames = {
  en: 'English',
  zh: 'Chinese',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  ar: 'Arabic',
  bn: 'Bengali',
  pt: 'Portuguese',
  ru: 'Russian',
  ur: 'Urdu',
  ja: 'Japanese',
  de: 'German',
  ko: 'Korean',
  sw: 'Swahili',
  it: 'Italian',
  tr: 'Turkish',
  vi: 'Vietnamese',
  ne: 'Nepali',
  ku: 'Kurdish',
  th: 'Thai',
  tl: 'Tagalog',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  sr: 'Serbian',
  bg: 'Bulgarian',
  el: 'Greek',
  nl: 'Dutch',
  sv: 'Swedish',
  fi: 'Finnish',
  da: 'Danish',
  no: 'Norwegian',
  uk: 'Ukrainian',
  pl: 'Polish'
} as const

// 学習言語ごとのプロンプト取得関数
const learningLanguagePromptGetters = {
  en: getEnglishPrompt,
  ko: getKoreanPrompt,
} as const

/**
 * 学習言語と母国語に基づいてプロンプトテンプレートを取得
 * @param learningLanguage 学習言語のコード（例: 'en', 'ko'）
 * @param nativeLanguage 母国語のコード（例: 'ja', 'en', 'ko'）
 * @param input ユーザーが入力したフレーズ
 * @param situation シチュエーション（オプション）
 * @returns 完成したプロンプト文字列
 */
export const getPromptTemplate = (learningLanguage: string, nativeLanguage: string, input: string, situation: string | undefined): string => {
  const nativeLanguageName = languageNames[nativeLanguage as keyof typeof languageNames] || nativeLanguage
  
  // 学習言語に対応するプロンプト取得関数を取得
  const promptGetter = learningLanguagePromptGetters[learningLanguage as keyof typeof learningLanguagePromptGetters]
  
  if (promptGetter) {
    return promptGetter(nativeLanguageName, input, situation)
  }
  
  // デフォルトは英語プロンプトを使用
  return getEnglishPrompt(nativeLanguageName, input, situation)
}
