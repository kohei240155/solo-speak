import { NextRequest, NextResponse } from 'next/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { authenticateRequest } from '@/utils/api-helpers'

interface TTSRequestBody {
  text: string
  language: string
}

interface TTSResponseData {
  success: boolean
  audioContent?: string
  error?: string
}

// Google Cloud TTS クライアントを初期化
let ttsClient: TextToSpeechClient | null = null

function initializeTTSClient() {
  if (!ttsClient) {
    try {
      // 環境変数からJSON文字列の認証情報を取得（開発・本番共通）
      const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
      
      if (!credentials) {
        throw new Error('GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set')
      }
      
      // JSON文字列から認証情報をパース
      const parsedCredentials = JSON.parse(credentials)
      ttsClient = new TextToSpeechClient({
        credentials: parsedCredentials,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      })
      console.log('Google Cloud TTS client initialized with JSON credentials')
      
    } catch (error) {
      console.error('Failed to initialize Google Cloud TTS client:', error)
      throw error
    }
  }
  return ttsClient
}

// 言語コードからGoogle TTS対応の音声名を取得
function getVoiceConfig(languageCode: string) {
  const voiceConfigs: { [key: string]: { languageCode: string; name: string; ssmlGender: string } } = {
    'en': { languageCode: 'en-US', name: 'en-US-Standard-A', ssmlGender: 'FEMALE' },
    'ja': { languageCode: 'ja-JP', name: 'ja-JP-Standard-A', ssmlGender: 'FEMALE' },
    'ko': { languageCode: 'ko-KR', name: 'ko-KR-Standard-A', ssmlGender: 'FEMALE' },
    'zh': { languageCode: 'zh-CN', name: 'zh-CN-Standard-A', ssmlGender: 'FEMALE' },
    'es': { languageCode: 'es-ES', name: 'es-ES-Standard-A', ssmlGender: 'FEMALE' },
    'fr': { languageCode: 'fr-FR', name: 'fr-FR-Standard-A', ssmlGender: 'FEMALE' },
    'de': { languageCode: 'de-DE', name: 'de-DE-Standard-A', ssmlGender: 'FEMALE' },
    'it': { languageCode: 'it-IT', name: 'it-IT-Standard-A', ssmlGender: 'FEMALE' },
    'pt': { languageCode: 'pt-BR', name: 'pt-BR-Standard-A', ssmlGender: 'FEMALE' },
    'ru': { languageCode: 'ru-RU', name: 'ru-RU-Standard-A', ssmlGender: 'FEMALE' },
    'nl': { languageCode: 'nl-NL', name: 'nl-NL-Standard-A', ssmlGender: 'FEMALE' },
    'sv': { languageCode: 'sv-SE', name: 'sv-SE-Standard-A', ssmlGender: 'FEMALE' },
    'da': { languageCode: 'da-DK', name: 'da-DK-Standard-A', ssmlGender: 'FEMALE' },
    'no': { languageCode: 'nb-NO', name: 'nb-NO-Standard-A', ssmlGender: 'FEMALE' },
    'fi': { languageCode: 'fi-FI', name: 'fi-FI-Standard-A', ssmlGender: 'FEMALE' },
  }

  return voiceConfigs[languageCode] || voiceConfigs['en']
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body: TTSRequestBody = await request.json()
    const { text, language } = body

    if (!text) {
      const errorResponse: TTSResponseData = {
        success: false,
        error: 'Text is required'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Google Cloud TTS クライアントを初期化
    const client = initializeTTSClient()

    // 言語設定を取得
    const voiceConfig = getVoiceConfig(language || 'en')

    console.log('TTS Request:', {
      text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      language,
      voiceConfig
    })

    // TTS リクエストを構築
    const request_tts = {
      input: { text },
      voice: {
        languageCode: voiceConfig.languageCode,
        name: voiceConfig.name,
        ssmlGender: voiceConfig.ssmlGender as 'NEUTRAL' | 'FEMALE' | 'MALE',
      },
      audioConfig: {
        audioEncoding: 'MP3' as const,
        speakingRate: 0.9, // 少し遅めに設定
        pitch: 0.0,
        volumeGainDb: 0.0,
      },
    }

    // TTS 実行
    const [response] = await client.synthesizeSpeech(request_tts)

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS service')
    }

    // Base64エンコードして返す
    const audioBase64 = Buffer.from(response.audioContent).toString('base64')

    console.log('TTS Response successful:', {
      audioSize: response.audioContent.length,
      base64Size: audioBase64.length
    })

    const responseData: TTSResponseData = {
      success: true,
      audioContent: audioBase64
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Error in TTS API:', error)
    
    const errorResponse: TTSResponseData = {
      success: false,
      error: error instanceof Error ? error.message : 'TTS generation failed'
    }
    
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
