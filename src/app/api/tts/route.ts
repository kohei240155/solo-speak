import { NextRequest, NextResponse } from 'next/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { getGoogleTTSLanguageCode, getLanguageSpecificVoiceSettings } from '@/utils/tts-language-mapping'

// Google Cloud Text-to-Speech クライアントの初期化
const client = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
})

console.log('TTS Client initialized with:', {
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
})

export async function POST(request: NextRequest) {
  try {
    console.log('TTS API called')
    const { text, languageCode = 'en' } = await request.json()
    console.log('Request data:', { text, languageCode })

    if (!text) {
      console.log('Error: Text is required')
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // 言語コードから適切なGoogle TTS言語コードを取得
    const googleLanguageCode = getGoogleTTSLanguageCode(languageCode)
    console.log('Google language code:', googleLanguageCode)
    
    // 言語固有の音声設定を取得
    const voiceSettings = getLanguageSpecificVoiceSettings(languageCode)
    console.log('Voice settings:', voiceSettings)

    // 音声合成のリクエスト設定
    const synthesisRequest = {
      input: { text },
      voice: {
        languageCode: googleLanguageCode,
        ssmlGender: voiceSettings.ssmlGender,
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: voiceSettings.speakingRate,
        pitch: voiceSettings.pitch,
      },
    }

    console.log('Synthesis request:', synthesisRequest)

    // Google Cloud Text-to-Speech API を呼び出し
    console.log('Calling Google Cloud TTS API...')
    const [response] = await client.synthesizeSpeech(synthesisRequest)
    console.log('TTS API response received')

    if (!response.audioContent) {
      console.log('Error: No audio content in response')
      return NextResponse.json(
        { error: 'Failed to generate audio' },
        { status: 500 }
      )
    }

    // 音声データをBase64エンコードして返す
    const audioBase64 = Buffer.from(response.audioContent).toString('base64')
    console.log('Audio generated successfully, size:', audioBase64.length)

    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      mimeType: 'audio/mpeg',
    })
  } catch (error) {
    console.error('Text-to-Speech error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}