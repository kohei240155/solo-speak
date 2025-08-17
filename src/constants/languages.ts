/**
 * 言語定数の定義
 * アプリケーション全体で使用する言語コードとデフォルト言語を一元管理
 */

// サポートされている言語コード
export const LANGUAGE_CODES = {
  ENGLISH: 'en',
  CHINESE: 'zh', 
  HINDI: 'hi',
  SPANISH: 'es',
  FRENCH: 'fr',
  PORTUGUESE: 'pt',
  JAPANESE: 'ja',
  GERMAN: 'de',
  KOREAN: 'ko',
  ITALIAN: 'it',
  THAI: 'th',
  DUTCH: 'nl',
  DANISH: 'da'
} as const

// サポート言語の配列（配列として必要な場合）
export const SUPPORTED_LANGUAGES = Object.values(LANGUAGE_CODES)

// デフォルト言語
export const DEFAULT_LANGUAGE = LANGUAGE_CODES.ENGLISH

// フォールバック言語（翻訳が見つからない場合に使用）
export const FALLBACK_LANGUAGE = LANGUAGE_CODES.JAPANESE

// UI表示言語（翻訳ファイルが存在する言語）
export const UI_LANGUAGES = ['en', 'ja', 'ko'] as const

// 言語コードの型定義
export type LanguageCode = typeof LANGUAGE_CODES[keyof typeof LANGUAGE_CODES]
export type UILanguage = typeof UI_LANGUAGES[number]

// 言語名のマッピング（動的生成）
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  [LANGUAGE_CODES.ENGLISH]: 'English',
  [LANGUAGE_CODES.CHINESE]: 'Chinese',
  [LANGUAGE_CODES.HINDI]: 'Hindi',
  [LANGUAGE_CODES.SPANISH]: 'Spanish',
  [LANGUAGE_CODES.FRENCH]: 'French',
  [LANGUAGE_CODES.PORTUGUESE]: 'Portuguese',
  [LANGUAGE_CODES.JAPANESE]: 'Japanese',
  [LANGUAGE_CODES.GERMAN]: 'German',
  [LANGUAGE_CODES.KOREAN]: 'Korean',
  [LANGUAGE_CODES.ITALIAN]: 'Italian',
  [LANGUAGE_CODES.THAI]: 'Thai',
  [LANGUAGE_CODES.DUTCH]: 'Dutch',
  [LANGUAGE_CODES.DANISH]: 'Danish'
} as const

// TTSマッピング（動的生成）
export const TTS_LANGUAGE_MAPPING: Record<LanguageCode, string> = {
  [LANGUAGE_CODES.ENGLISH]: 'en-US',
  [LANGUAGE_CODES.CHINESE]: 'zh-CN',
  [LANGUAGE_CODES.HINDI]: 'hi-IN',
  [LANGUAGE_CODES.SPANISH]: 'es-ES',
  [LANGUAGE_CODES.FRENCH]: 'fr-FR',
  [LANGUAGE_CODES.PORTUGUESE]: 'pt-PT',
  [LANGUAGE_CODES.JAPANESE]: 'ja-JP',
  [LANGUAGE_CODES.GERMAN]: 'de-DE',
  [LANGUAGE_CODES.KOREAN]: 'ko-KR',
  [LANGUAGE_CODES.ITALIAN]: 'it-IT',
  [LANGUAGE_CODES.THAI]: 'th-TH',
  [LANGUAGE_CODES.DUTCH]: 'nl-NL',
  [LANGUAGE_CODES.DANISH]: 'da-DK'
} as const

/**
 * 新しい言語を追加する際のヘルパー関数
 * 言語が正しく設定されているかチェック
 */
export function validateLanguageSetup(languageCode: LanguageCode): boolean {
  return !!(
    LANGUAGE_NAMES[languageCode] &&
    TTS_LANGUAGE_MAPPING[languageCode] &&
    SUPPORTED_LANGUAGES.includes(languageCode)
  )
}

/**
 * UI言語として利用可能かチェック
 */
export function isUILanguage(languageCode: string): languageCode is UILanguage {
  return UI_LANGUAGES.includes(languageCode as UILanguage)
}
