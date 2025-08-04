/**
 * 言語コードからGoogle Cloud Text-to-Speech APIの言語コードにマッピング
 */
export const getGoogleTTSLanguageCode = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'zh': 'zh-CN',
    'hi': 'hi-IN',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'pt': 'pt-PT',
    'ja': 'ja-JP',
    'de': 'de-DE',
    'ko': 'ko-KR',
    'it': 'it-IT',
    'th': 'th-TH',
    'nl': 'nl-NL',
    'da': 'da-DK'
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
