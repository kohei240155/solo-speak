/**
 * アプリケーション固有のビジネスロジック
 * 言語設定の自動化を支援するユーティリティ
 */

import { UI_LANGUAGES, LANGUAGE_CODES, LanguageCode } from './languages'

/**
 * デモ用のサンプルテキストと言語のマッピング
 */
export const DEMO_SAMPLES = {
  ['en']: {
    text: "How long have you been living in Japan?",
    voiceLanguage: LANGUAGE_CODES.ENGLISH
  },
  ['ja']: {
    text: "日本にはどのぐらい住んでいるの？",
    voiceLanguage: LANGUAGE_CODES.JAPANESE
  },
  ['ko']: {
    text: "How long have you been living in Japan?",
    voiceLanguage: LANGUAGE_CODES.KOREAN
  }
} as const

/**
 * 現在のUIロケールに基づいて適切なデモサンプルを取得
 */
export function getDemoSample(locale: string) {
  // UI言語として利用可能な場合は対応するサンプルを返す
  if (locale === LANGUAGE_CODES.ENGLISH) {
    return DEMO_SAMPLES[LANGUAGE_CODES.JAPANESE] // 英語UIの場合は日本語サンプル
  } else if (locale === LANGUAGE_CODES.JAPANESE) {
    return DEMO_SAMPLES[LANGUAGE_CODES.ENGLISH] // 日本語UIの場合は英語サンプル
  }
  
  // デフォルトは英語サンプル
  return DEMO_SAMPLES[LANGUAGE_CODES.ENGLISH]
}

/**
 * 言語追加時のチェックリスト生成
 */
export function generateLanguageAdditionChecklist(languageCode: LanguageCode): string[] {
  const checklist = [
    `✓ LANGUAGE_CODES に ${languageCode} を追加`,
    `✓ LANGUAGE_NAMES に ${languageCode} の名前を追加`,
    `✓ TTS_LANGUAGE_MAPPING に ${languageCode} のTTSコードを追加`
  ]
  
  // UI言語として追加する場合
  if (UI_LANGUAGES.length < 3) {
    checklist.push(`○ UI_LANGUAGES に ${languageCode} を追加（翻訳ファイルも必要）`)
  }
  
  // プロンプト対応
  checklist.push(`○ prompts/ ディレクトリに ${languageCode}.ts を作成（オプション）`)
  
  return checklist
}
