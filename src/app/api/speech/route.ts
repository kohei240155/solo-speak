import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { text, language } = body

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // 言語コードを適切なBCP 47形式に変換
    const getLanguageCode = (lang: string): string => {
      const languageMap: { [key: string]: string } = {
        'en': 'en-US',
        'ja': 'ja-JP',
        'ko': 'ko-KR',
        'zh': 'zh-CN',
        'es': 'es-ES',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'ru': 'ru-RU',
        'ar': 'ar-SA',
        'hi': 'hi-IN',
        'th': 'th-TH',
        'vi': 'vi-VN',
        'nl': 'nl-NL',
        'sv': 'sv-SE',
        'da': 'da-DK',
        'no': 'nb-NO',
        'fi': 'fi-FI',
        'pl': 'pl-PL',
        'tr': 'tr-TR',
        'he': 'he-IL',
        'cs': 'cs-CZ',
        'hu': 'hu-HU',
        'ro': 'ro-RO',
        'bg': 'bg-BG',
        'hr': 'hr-HR',
        'sk': 'sk-SK',
        'sl': 'sl-SI',
        'et': 'et-EE',
        'lv': 'lv-LV',
        'lt': 'lt-LT',
        'mt': 'mt-MT',
        'ga': 'ga-IE',
        'eu': 'eu-ES',
        'ca': 'ca-ES',
        'gl': 'gl-ES',
        'cy': 'cy-GB',
        'is': 'is-IS',
        'fo': 'fo-FO',
        'mk': 'mk-MK',
        'sq': 'sq-AL',
        'sr': 'sr-RS',
        'bs': 'bs-BA',
        'me': 'cnr-ME',
        'uk': 'uk-UA',
        'be': 'be-BY',
        'kk': 'kk-KZ',
        'ky': 'ky-KG',
        'uz': 'uz-UZ',
        'tg': 'tg-TJ',
        'mn': 'mn-MN',
        'ka': 'ka-GE',
        'hy': 'hy-AM',
        'az': 'az-AZ',
        'id': 'id-ID',
        'ms': 'ms-MY',
        'tl': 'tl-PH',
        'sw': 'sw-KE',
        'am': 'am-ET',
        'bn': 'bn-BD',
        'gu': 'gu-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'mr': 'mr-IN',
        'ne': 'ne-NP',
        'or': 'or-IN',
        'pa': 'pa-IN',
        'si': 'si-LK',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'ur': 'ur-PK'
      }
      
      return languageMap[lang] || 'en-US'
    }

    const languageCode = getLanguageCode(language || 'en')

    // 音声合成のレスポンス形式を返す
    return NextResponse.json({
      success: true,
      text,
      language: languageCode,
      message: 'Speech synthesis parameters prepared'
    })

  } catch (error) {
    console.error('Error in speech API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
