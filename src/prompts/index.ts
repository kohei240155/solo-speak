import { getEnglishPrompt } from './en'
import { getKoreanPrompt } from './ko'
import { getJapanesePrompt } from './ja'
import { getChinesePrompt } from './zh'
import { LANGUAGE_CODES, LANGUAGE_NAMES, LanguageCode } from '@/constants/languages'

// 学習言語ごとのプロンプト取得関数（利用可能なもののみ）
const learningLanguagePromptGetters = {
  [LANGUAGE_CODES.ENGLISH]: getEnglishPrompt,
  [LANGUAGE_CODES.KOREAN]: getKoreanPrompt,
  [LANGUAGE_CODES.JAPANESE]: getJapanesePrompt,
  [LANGUAGE_CODES.CHINESE]: getChinesePrompt
} as const

// デフォルトプロンプト（英語）
const DEFAULT_PROMPT_GETTER = getEnglishPrompt

/**
 * 学習言語と母国語に基づいてプロンプトテンプレートを取得
 * @param learningLanguage 学習言語のコード
 * @param nativeLanguage 母国語のコード
 * @param input ユーザーが入力したフレーズ
 * @param situation シチュエーション（オプション）
 * @returns 完成したプロンプト文字列
 */
export const getPromptTemplate = (learningLanguage: string, nativeLanguage: string, input: string, situation: string | undefined): string => {
  const nativeLanguageName = LANGUAGE_NAMES[nativeLanguage as LanguageCode] || nativeLanguage
  
  // 学習言語に対応するプロンプト取得関数を取得
  const promptGetter = learningLanguagePromptGetters[learningLanguage as keyof typeof learningLanguagePromptGetters] || DEFAULT_PROMPT_GETTER
  
  return promptGetter(nativeLanguageName, input, situation)
}

// 名前のマッピングをエクスポート（他でも利用するため）
export const languageNames = LANGUAGE_NAMES
