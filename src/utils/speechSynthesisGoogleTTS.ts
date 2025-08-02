import toast from 'react-hot-toast'

// 音声キャッシュ用のインターface
interface AudioCache {
  [key: string]: string // key: text + language, value: base64 audio data
}

// メモリ内音声キャッシュ
const audioCache: AudioCache = {}

// キャッシュキーを生成
function generateCacheKey(text: string, languageCode: string): string {
  return `${languageCode}:${text}`
}

// Base64文字列をBlobに変換
function base64ToBlob(base64: string, mimeType: string = 'audio/mp3'): Blob {
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

// 音声再生（HTMLAudioElementを使用）
async function playAudioFromBase64(base64AudioData: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const blob = base64ToBlob(base64AudioData)
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      
      audio.oncanplaythrough = () => {
        console.log('Audio loaded and ready to play')
      }
      
      audio.onended = () => {
        console.log('Audio playback completed')
        URL.revokeObjectURL(audioUrl) // メモリリークを防ぐ
        resolve()
      }
      
      audio.onerror = (event) => {
        console.error('Audio playback error:', event)
        URL.revokeObjectURL(audioUrl)
        reject(new Error('Audio playback failed'))
      }
      
      audio.play().catch((error) => {
        console.error('Audio play() failed:', error)
        URL.revokeObjectURL(audioUrl)
        reject(error)
      })
      
    } catch (error) {
      console.error('Error creating audio from base64:', error)
      reject(error)
    }
  })
}

// Google Cloud TTSを使用してテキストを音声で読み上げる関数
export const speakText = async (text: string, languageCode: string): Promise<void> => {
  try {
    console.log('speakText called:', { text: text.substring(0, 50), languageCode })
    
    // キャッシュキーを生成
    const cacheKey = generateCacheKey(text, languageCode)
    
    // キャッシュをチェック
    if (audioCache[cacheKey]) {
      console.log('Playing audio from cache')
      await playAudioFromBase64(audioCache[cacheKey])
      return
    }
    
    console.log('Audio not in cache, requesting from TTS API')
    
    // TTS APIを呼び出し
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        language: languageCode
      }),
    })

    if (!response.ok) {
      throw new Error(`TTS API request failed: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'TTS generation failed')
    }

    if (!data.audioContent) {
      throw new Error('No audio content received')
    }

    console.log('TTS API response successful, caching and playing audio')
    
    // 音声データをキャッシュに保存
    audioCache[cacheKey] = data.audioContent
    
    // 音声を再生
    await playAudioFromBase64(data.audioContent)
    
  } catch (error) {
    console.error('Error in speakText:', error)
    toast.error('音声再生に失敗しました')
    throw error
  }
}

// Web Speech API の代替関数（後方互換性のため）
export const speakTextLegacy = async (text: string, languageCode: string): Promise<void> => {
  if (!('speechSynthesis' in window)) {
    toast.error('音声再生がサポートされていません')
    return
  }

  try {
    // 既存の音声を停止
    speechSynthesis.cancel()
    
    // 短い遅延を追加
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = languageCode
    utterance.rate = 0.9
    utterance.pitch = 1.0
    utterance.volume = 1.0
    
    return new Promise<void>((resolve, reject) => {
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        if (event.error !== 'interrupted') {
          toast.error('音声再生中にエラーが発生しました')
          reject(new Error(event.error))
        } else {
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

// キャッシュクリア関数（メモリ管理用）
export const clearAudioCache = (): void => {
  const cacheSize = Object.keys(audioCache).length
  Object.keys(audioCache).forEach(key => delete audioCache[key])
  console.log(`Audio cache cleared: ${cacheSize} items removed`)
}

// キャッシュ統計取得
export const getAudioCacheStats = (): { size: number; keys: string[] } => {
  const keys = Object.keys(audioCache)
  return {
    size: keys.length,
    keys: keys
  }
}

// 音声リストを事前初期化する関数（Google Cloud TTSでは不要だが、後方互換性のため残す）
export const preloadVoices = (): void => {
  console.log('preloadVoices called - Using Google Cloud TTS, no preloading needed')
}

// 初期化時のvoid化対応（後方互換性）
export const initializeVoices = (): Promise<void> => {
  return Promise.resolve()
}
