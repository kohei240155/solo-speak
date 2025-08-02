// スピーチAPI用の型定義

export interface SpeechRequestBody {
  text: string
  language: string
}

export interface SpeechResponseData {
  success: true
  text: string
  language: string
  message: string
}

// Google Cloud TTS API用の型定義
export interface TTSRequestBody {
  text: string
  language: string
}

export interface TTSResponseData {
  success: boolean
  audioContent?: string
  error?: string
}
