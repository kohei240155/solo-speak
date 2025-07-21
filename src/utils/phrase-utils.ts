// 正解数に応じて縦線の色を決定する関数
export const getBorderColor = (correctAnswers: number) => {
  if (correctAnswers === 0) return '#D9D9D9'
  if (correctAnswers <= 1) return '#BFBFBF'
  if (correctAnswers <= 3) return '#A6A6A6'
  if (correctAnswers <= 5) return '#8C8C8C'
  if (correctAnswers <= 10) return '#737373'
  if (correctAnswers <= 20) return '#595959'
  if (correctAnswers <= 30) return '#404040'
  return '#404040' // 30以上の場合
}

// 音声再生機能
export const playText = async (text: string, learningLanguage: string) => {
  if ('speechSynthesis' in window) {
    try {
      // 既存の音声を停止
      speechSynthesis.cancel()
      
      // 音声リストが読み込まれるまで待機
      const waitForVoices = () => {
        return new Promise<SpeechSynthesisVoice[]>((resolve) => {
          const voices = speechSynthesis.getVoices()
          if (voices.length > 0) {
            resolve(voices)
          } else {
            speechSynthesis.addEventListener('voiceschanged', () => {
              resolve(speechSynthesis.getVoices())
            }, { once: true })
          }
        })
      }

      const voices = await waitForVoices()
      const utterance = new SpeechSynthesisUtterance(text)
      
      // 言語コードを標準的な形式にマッピング
      const languageMap: { [key: string]: string[] } = {
        'en': ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en'],
        'ja': ['ja-JP', 'ja'],
        'ko': ['ko-KR', 'ko'],
        'zh': ['zh-CN', 'zh-TW', 'zh-HK', 'zh'],
        'es': ['es-ES', 'es-MX', 'es-US', 'es'],
        'fr': ['fr-FR', 'fr-CA', 'fr'],
        'de': ['de-DE', 'de-AT', 'de'],
        'it': ['it-IT', 'it'],
        'pt': ['pt-BR', 'pt-PT', 'pt'],
        'ru': ['ru-RU', 'ru'],
        'nl': ['nl-NL', 'nl'],
        'sv': ['sv-SE', 'sv'],
        'da': ['da-DK', 'da'],
        'no': ['nb-NO', 'nn-NO', 'no'],
        'fi': ['fi-FI', 'fi']
      }

      // 対応する言語コードを取得
      const targetLanguages = languageMap[learningLanguage] || [learningLanguage]
      
      // 最適な音声を検索
      let selectedVoice: SpeechSynthesisVoice | null = null
      
      // 1. 完全一致を探す
      for (const langCode of targetLanguages) {
        selectedVoice = voices.find(v => v.lang === langCode) || null
        if (selectedVoice) break
      }
      
      // 2. 部分一致を探す
      if (!selectedVoice) {
        for (const langCode of targetLanguages) {
          selectedVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0])) || null
          if (selectedVoice) break
        }
      }

      // 3. 音声設定を適用
      if (selectedVoice) {
        utterance.voice = selectedVoice
        console.log('Selected voice:', selectedVoice.name, selectedVoice.lang)
      } else {
        console.warn('No suitable voice found for language:', learningLanguage)
        console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })))
      }
      
      // 音声の設定を調整
      utterance.rate = 0.9 // 少し遅めに設定
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = selectedVoice?.lang || targetLanguages[0] || 'en-US'
      
      // エラーハンドリング
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
      }

      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error('Error in playText:', error)
    }
  } else {
    console.warn('Speech synthesis not supported')
  }
}
