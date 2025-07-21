import toast from 'react-hot-toast'

// 音声リストを初期化する関数
export const initializeVoices = (): Promise<SpeechSynthesisVoice[]> => {
  if (!('speechSynthesis' in window)) {
    throw new Error('Speech synthesis is not supported')
  }

  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(voices)
    } else {
      const handleVoicesChanged = () => {
        const updatedVoices = speechSynthesis.getVoices()
        if (updatedVoices.length > 0) {
          speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
          resolve(updatedVoices)
        }
      }
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    }
  })
}

// 言語コードマッピング
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

// 最適な音声を選択する関数
const selectBestVoice = (voices: SpeechSynthesisVoice[], languageCode: string): SpeechSynthesisVoice | null => {
  const targetLanguages = languageMap[languageCode] || [languageCode]
  
  // 1. 完全一致を探す
  for (const langCode of targetLanguages) {
    const voice = voices.find(v => v.lang === langCode)
    if (voice) return voice
  }
  
  // 2. 部分一致を探す
  for (const langCode of targetLanguages) {
    const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]))
    if (voice) return voice
  }
  
  return null
}

// テキストを音声で読み上げる関数
export const speakText = async (text: string, languageCode: string): Promise<void> => {
  if (!('speechSynthesis' in window)) {
    toast.error('音声再生がサポートされていません')
    return
  }

  try {
    // 既存の音声を停止（少し待機してから新しい音声を開始）
    speechSynthesis.cancel()
    
    // 短い遅延を追加して、cancelが完了するのを待つ
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const voices = await initializeVoices()
    const utterance = new SpeechSynthesisUtterance(text)
    
    const selectedVoice = selectBestVoice(voices, languageCode)
    
    if (selectedVoice) {
      utterance.voice = selectedVoice
      console.log('Selected voice:', selectedVoice.name, selectedVoice.lang)
    } else {
      // フォールバック: 利用可能な音声をログ出力してデバッグを支援
      console.warn('No suitable voice found for language:', languageCode)
      console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })))
    }
    
    // 音声の設定を調整
    utterance.rate = 0.9 // 少し遅めに設定
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.lang = selectedVoice?.lang || languageMap[languageCode]?.[0] || 'en-US'
    
    // エラーハンドリング
    return new Promise<void>((resolve, reject) => {
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        
        // interrupted エラーは正常な動作の一部なので、ユーザーには表示しない
        if (event.error !== 'interrupted') {
          toast.error('音声再生中にエラーが発生しました')
          reject(new Error(event.error))
        } else {
          // interrupted の場合は正常終了として扱う
          resolve()
        }
      }

      utterance.onend = () => {
        console.log('Speech synthesis completed')
        resolve()
      }
      
      speechSynthesis.speak(utterance)
    })
  } catch (error) {
    console.error('Error playing sound:', error)
    toast.error('音声再生に失敗しました')
  }
}

// 音声リストを事前初期化する関数
export const preloadVoices = (): void => {
  if ('speechSynthesis' in window) {
    const initVoices = () => {
      const voices = speechSynthesis.getVoices()
      if (voices.length === 0) {
        speechSynthesis.addEventListener('voiceschanged', initVoices, { once: true })
      } else {
        console.log('Voices initialized:', voices.length, 'voices available')
      }
    }
    initVoices()
  }
}
