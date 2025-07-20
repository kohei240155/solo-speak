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
export const playText = (text: string, learningLanguage: string) => {
  if ('speechSynthesis' in window) {
    // 既存の音声を停止
    speechSynthesis.cancel()
    
    const utterance = new SpeechSynthesisUtterance(text)
    
    // 学習言語に応じて音声言語を設定
    const languageMap: { [key: string]: string } = {
      'en': 'en-US',
      'ja': 'ja-JP',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ru': 'ru-RU',
      'ko': 'ko-KR',
      'zh': 'zh-CN'
    }
    
    utterance.lang = languageMap[learningLanguage] || 'en-US'
    utterance.rate = 0.8 // 再生速度を少し遅くする
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    speechSynthesis.speak(utterance)
  } else {
    console.warn('Speech synthesis not supported')
  }
}
