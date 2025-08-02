import { useState, useCallback } from 'react'

interface UseTextToSpeechOptions {
  languageCode?: string
}

interface UseTextToSpeechReturn {
  isPlaying: boolean
  error: string | null
  playText: (text: string) => Promise<void>
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}): UseTextToSpeechReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playText = useCallback(async (text: string) => {
    if (!text.trim()) {
      setError('テキストが空です')
      return
    }

    setIsPlaying(true)
    setError(null)

    try {
      // Text-to-Speech API を呼び出し
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          languageCode: options.languageCode || 'en',
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
      
      // 再生完了時のクリーンアップ
      audio.addEventListener('ended', () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      })

      // エラー時のクリーンアップ
      audio.addEventListener('error', () => {
        setIsPlaying(false)
        setError('音声の再生に失敗しました')
        URL.revokeObjectURL(audioUrl)
      })

      await audio.play()
    } catch (err) {
      setIsPlaying(false)
      const errorMessage = err instanceof Error ? err.message : '音声の生成に失敗しました'
      setError(errorMessage)
      console.error('Text-to-Speech error:', err)
    }
  }, [options.languageCode])

  return {
    isPlaying,
    error,
    playText,
  }
}
