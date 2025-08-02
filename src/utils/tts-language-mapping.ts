/**
 * 言語コードからGoogle Cloud Text-to-Speech APIの言語コードにマッピング
 */
export const getGoogleTTSLanguageCode = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    // 主要な言語
    'ja': 'ja-JP',
    'en': 'en-US',
    'zh': 'zh-CN',
    'ko': 'ko-KR',
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
    'id': 'id-ID',
    
    // その他の言語
    'tr': 'tr-TR',
    'pl': 'pl-PL',
    'nl': 'nl-NL',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'no': 'nb-NO',
    'fi': 'fi-FI',
    'cs': 'cs-CZ',
    'sk': 'sk-SK',
    'hu': 'hu-HU',
    'el': 'el-GR',
    'he': 'he-IL',
    'uk': 'uk-UA',
    'bg': 'bg-BG',
    'hr': 'hr-HR',
    'ro': 'ro-RO',
    'sr': 'sr-RS',
    'sl': 'sl-SI',
    'et': 'et-EE',
    'lv': 'lv-LV',
    'lt': 'lt-LT',
    'mt': 'mt-MT',
  }
  
  return languageMap[languageCode] || 'en-US' // デフォルトは英語
}

/**
 * 音声の速度やピッチなどを言語に応じて調整
 */
export const getLanguageSpecificVoiceSettings = (languageCode: string) => {
  // 言語に応じて設定を調整
  switch (languageCode) {
    case 'ja':
      return {
        speakingRate: 0.9, // 日本語は少し遅めに
        pitch: 0.0,
        ssmlGender: 'FEMALE' as const
      }
    case 'ko':
      return {
        speakingRate: 0.9,
        pitch: 0.0,
        ssmlGender: 'FEMALE' as const
      }
    case 'zh':
      return {
        speakingRate: 0.9,
        pitch: 0.0,
        ssmlGender: 'FEMALE' as const
      }
    default:
      return {
        speakingRate: 1.0,
        pitch: 0.0,
        ssmlGender: 'NEUTRAL' as const
      }
  }
}
