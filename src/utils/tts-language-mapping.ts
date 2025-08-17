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
 * 音声の速度やピッチなどのデフォルト設定
 */
export const getLanguageSpecificVoiceSettings = () => {
  // 全ての言語でデフォルト設定を使用
  return {
    speakingRate: 0.9,
    pitch: 0.0,
    ssmlGender: 'NEUTRAL' as const
  }
}
