import { NextRequest, NextResponse } from 'next/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { getGoogleTTSLanguageCode, getLanguageSpecificVoiceSettings } from '@/utils/tts-language-mapping'

// Google Cloud Text-to-Speech クライアントの初期化
// Vercel対応: 環境変数から認証情報を読み込み
const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
if (!serviceAccountKey) {
  throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set')
}

const credentials = JSON.parse(serviceAccountKey)

const client = new TextToSpeechClient({
  credentials,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
})

/** * Google Cloud Text-to-Speech APIを使用してテキストを音声に変換するAPIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns { success: boolean, audioData?: string, mimeType?: string, error?: string } - 音声データまたはエラー情報
 */
export async function POST(request: NextRequest) {
  try {
    const { text, languageCode = 'en' } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    // 言語コードから適切なGoogle TTS言語コードを取得
    const googleLanguageCode = getGoogleTTSLanguageCode(languageCode)
    
    // 言語固有の音声設定を取得
    const voiceSettings = getLanguageSpecificVoiceSettings(languageCode)

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

    // Google Cloud Text-to-Speech API を呼び出し
    const [response] = await client.synthesizeSpeech(synthesisRequest)

    if (!response.audioContent) {
      return NextResponse.json(
        { error: 'Failed to generate audio' },
        { status: 500 }
      )
    }

    // 音声データをBase64エンコードして返す
    const audioBase64 = Buffer.from(response.audioContent).toString('base64')

    return NextResponse.json({
      success: true,
      audioData: audioBase64,
      mimeType: 'audio/mpeg',
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}