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
