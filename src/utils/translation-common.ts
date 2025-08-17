// 翻訳関連の共通型定義とユーティリティ
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/constants/languages'

export interface TranslationData {
  [key: string]: string | TranslationData
}

export interface TranslationOptions {
  [key: string]: string | number
}

/**
 * ネストしたキーから翻訳値を取得する共通関数
 * @param translations 翻訳データ
 * @param key ドット記法のキー（例: 'phrase.messages.dailyLimitExceeded'）
 * @param options 変数置換用のオプション
 * @returns 翻訳されたテキスト
 */
export function getNestedTranslation(
  translations: TranslationData, 
  key: string, 
  options?: TranslationOptions
): string {
  const keys = key.split('.')
  let value: string | TranslationData = translations
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // キーが見つからない場合はキーをそのまま返す
      return key
    }
  }
  
  if (typeof value !== 'string') {
    return key
  }
  
  // シンプルな変数置換（{{variable}}形式）
  if (options) {
    return value.replace(/\{\{(\w+)\}\}/g, (match: string, varName: string) => {
      return String(options[varName] || match)
    })
  }
  
  return value
}

/**
 * Accept-Languageヘッダーから言語を取得
 * @param acceptLanguage Accept-Languageヘッダーの値
 * @returns 言語コード
 */
export function getLocaleFromAcceptLanguage(acceptLanguage: string): string {
  if (!acceptLanguage) {
    return DEFAULT_LANGUAGE
  }

  // 最初に出現するサポート言語を返す（シンプルな処理）
  for (const supportedLang of SUPPORTED_LANGUAGES) {
    if (acceptLanguage.includes(supportedLang)) {
      return supportedLang
    }
  }

  return DEFAULT_LANGUAGE
}
