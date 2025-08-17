import { useState, useRef, useCallback } from 'react'
import { DEFAULT_LANGUAGE } from '@/constants/languages'

interface UseTextToSpeechOptions {
  languageCode?: string
}

interface UseTextToSpeechReturn {
  isPlaying: boolean
  error: string | null
  playText: (text: string) => Promise<void>
  clearCache: () => void
}

interface CachedAudio {
  audioUrl: string
  audio: HTMLAudioElement
  handleEnded?: () => void
  handleError?: () => void
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 音声キャッシュを保存するRef
  const audioCache = useRef<Map<string, CachedAudio>>(new Map())
  
  // キャッシュキーを生成する関数
  const getCacheKey = useCallback((text: string, languageCode: string) => {
    return `${text.trim()}_${languageCode}`
  }, [])

  const playText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('テキストが空です')
      return
    }

    setIsPlaying(true)
    setError(null)

    try {
      const languageCode = options.languageCode || DEFAULT_LANGUAGE
      const cacheKey = getCacheKey(text, languageCode)
      
      // キャッシュから音声を取得
      const cachedAudio = audioCache.current.get(cacheKey)
      
      if (cachedAudio) {
        // キャッシュされた音声を再生
        const audio = cachedAudio.audio
        
        // 既存のイベントリスナーをクリア（重複防止）
        audio.removeEventListener('ended', cachedAudio.handleEnded || (() => {}))
        audio.removeEventListener('error', cachedAudio.handleError || (() => {}))
        
        // 再生完了時のクリーンアップ
        const handleEnded = () => {
          setIsPlaying(false)
          audio.removeEventListener('ended', handleEnded)
          audio.removeEventListener('error', handleError)
        }
        
        const handleError = () => {
          setIsPlaying(false)
          setError('音声の再生に失敗しました')
          audio.removeEventListener('ended', handleEnded)
          audio.removeEventListener('error', handleError)
        }
        
        // キャッシュにイベントハンドラーを保存
        cachedAudio.handleEnded = handleEnded
        cachedAudio.handleError = handleError
        
        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('error', handleError)
        
        // 音声を最初から再生
        audio.currentTime = 0
        
        // 音声が準備できているかチェック
        if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
          try {
            await audio.play()
          } catch {
            setIsPlaying(false)
            setError('音声の再生に失敗しました')
          }
        } else {
          // データがまだ準備できていない場合は、loadeddata イベントを待つ
          const handleLoadedData = async () => {
            try {
              await audio.play()
            } catch {
              setIsPlaying(false)
              setError('音声の再生に失敗しました')
            }
            audio.removeEventListener('loadeddata', handleLoadedData)
          }
          
          audio.addEventListener('loadeddata', handleLoadedData)
          audio.load() // 音声データを再ロード
        }
        return
      }

      // キャッシュにない場合は新しく音声を取得
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          languageCode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate speech')
      }

      const data = await response.json()

      if (!data.success || !data.audioData) {
        throw new Error('Invalid response from server')
      }

      // Base64の音声データをBlobに変換
      const audioBytes = Uint8Array.from(atob(data.audioData), c => c.charCodeAt(0))
      const audioBlob = new Blob([audioBytes], { type: data.mimeType || 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(audioBlob)

      // 音声を再生
      const audio = new Audio(audioUrl)
      
      // preloadを設定して音声データを先読みする
      audio.preload = 'auto'
      
      // キャッシュに保存
      audioCache.current.set(cacheKey, { audioUrl, audio })
      
      // 再生完了時のクリーンアップ
      const handleEnded = () => {
        setIsPlaying(false)
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
      }
      
      const handleError = () => {
        setIsPlaying(false)
        setError('音声の再生に失敗しました')
        audio.removeEventListener('ended', handleEnded)
        audio.removeEventListener('error', handleError)
        
        // エラー時はキャッシュからも削除
        audioCache.current.delete(cacheKey)
        URL.revokeObjectURL(audioUrl)
      }
      
      audio.addEventListener('ended', handleEnded)
      audio.addEventListener('error', handleError)

      try {
        // 音声データがロードされるまで待つ
        if (audio.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
          await new Promise<void>((resolve, reject) => {
            const handleCanPlay = () => {
              audio.removeEventListener('canplay', handleCanPlay)
              audio.removeEventListener('error', handleLoadError)
              resolve()
            }
            const handleLoadError = () => {
              audio.removeEventListener('canplay', handleCanPlay)
              audio.removeEventListener('error', handleLoadError)
              reject(new Error('音声の読み込みに失敗しました'))
            }
            audio.addEventListener('canplay', handleCanPlay)
            audio.addEventListener('error', handleLoadError)
          })
        }
        
        await audio.play()
      } catch {
        setIsPlaying(false)
        setError('音声の再生に失敗しました')
        // エラー時はキャッシュからも削除
        audioCache.current.delete(cacheKey)
        URL.revokeObjectURL(audioUrl)
      }
    } catch (err) {
      setIsPlaying(false)
      const errorMessage = err instanceof Error ? err.message : '音声の生成に失敗しました'
      setError(errorMessage)
    }
  }, [options.languageCode, getCacheKey])

  // キャッシュをクリアする関数
  const clearCache = useCallback(() => {
    // すべてのオーディオURLを解放
    audioCache.current.forEach(({ audioUrl }) => {
      URL.revokeObjectURL(audioUrl)
    })
    // キャッシュをクリア
    audioCache.current.clear()
  }, [])

  return {
    isPlaying,
    error,
    playText,
    clearCache,
  }
}
