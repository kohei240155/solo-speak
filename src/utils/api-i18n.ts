import fs from 'fs'
import path from 'path'
import { 
  TranslationData, 
  getNestedTranslation, 
  getLocaleFromAcceptLanguage 
} from './translation-common'

// 翻訳データのキャッシュ
const translationCache: { [locale: string]: TranslationData } = {}

/**
 * APIルート用の翻訳関数
 * @param locale 言語コード ('en' | 'ja')
 * @param key 翻訳キー (例: 'phrase.messages.dailyLimitExceeded')
 * @returns 翻訳されたテキスト
 */
export function getTranslation(locale: string = 'ja', key: string): string {
  try {
    // キャッシュから翻訳データを取得（なければ読み込み）
    if (!translationCache[locale]) {
      const filePath = path.join(process.cwd(), 'public', 'locales', locale, 'common.json')
      const fileContent = fs.readFileSync(filePath, 'utf8')
      translationCache[locale] = JSON.parse(fileContent)
    }

    // 共通関数を使用して翻訳を取得
    const translation = getNestedTranslation(translationCache[locale], key)
    
    // キーが見つからない場合で、日本語以外の場合は日本語でフォールバック
    if (translation === key && locale !== 'ja') {
      return getTranslation('ja', key)
    }

    return translation
  } catch {
    return key // エラー時はキーをそのまま返す
  }
}

/**
 * リクエストヘッダーから言語を取得
 * @param request NextRequest
 * @returns 言語コード
 */
export function getLocaleFromRequest(request: Request): string {
  const acceptLanguage = request.headers.get('accept-language') || ''
  return getLocaleFromAcceptLanguage(acceptLanguage)
}
