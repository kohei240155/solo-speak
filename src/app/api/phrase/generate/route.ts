import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const generatePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  desiredPhrase: z.string().min(1).max(100),
  selectedStyle: z.enum(['common', 'business', 'casual']),
})

interface PhraseVariation {
  type: 'common' | 'business' | 'casual'
  text: string
  explanation?: string
}

interface GeneratePhraseResponse {
  variations: PhraseVariation[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { nativeLanguage, learningLanguage, desiredPhrase, selectedStyle } = generatePhraseSchema.parse(body)

    // テスト用: 固定の応答を返す (API料金節約のため)
    // 本番時はコメントアウトして下のChatGPT API呼び出しを有効化
    const result: GeneratePhraseResponse = {
      variations: getMockVariations(selectedStyle)
    }
    return NextResponse.json(result)

    // ===== ChatGPT API呼び出し (本番用) =====
    // 下記のコメントアウトを解除してAPIを有効化
    /*
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // ChatGPT APIに送信するプロンプトを構築
    const prompt = buildPrompt(nativeLanguage, learningLanguage, desiredPhrase)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(nativeLanguage, learningLanguage, selectedStyle)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate phrases' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'No content generated' },
        { status: 500 }
      )
    }

    // ChatGPTの応答をパースして構造化データに変換
    const variations = parseGeneratedContent(generatedContent, selectedStyle)

    const result: GeneratePhraseResponse = {
      variations
    }

    return NextResponse.json(result)
    */

  } catch (error) {
    console.error('Error generating phrases:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// テスト用の固定レスポンス関数
function getMockVariations(selectedStyle: 'common' | 'business' | 'casual'): PhraseVariation[] {
  return [
    {
      type: selectedStyle,
      text: 'I want to go see fireworks tomorrow.',
    },
    {
      type: selectedStyle,
      text: "I'm thinking of going to see the fireworks tomorrow.",
    },
    {
      type: selectedStyle,
      text: "I'd like to check out the fireworks tomorrow.",
    }
  ]
}

// ===== ChatGPT API関連関数 (本番用に保持) =====

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getSystemPrompt(nativeLanguage: string, learningLanguage: string, selectedStyle: 'common' | 'business' | 'casual'): string {
  const languageNames = {
    ja: '日本語',
    en: '英語',
    ko: '韓国語',
    zh: '中国語',
    es: 'スペイン語',
    fr: 'フランス語',
    de: 'ドイツ語'
  }

  const styleDescriptions = {
    common: '誰にでも使える自然な言い方（バランスの取れた日常表現）',
    business: 'ビジネスシーンで使える表現（職場で適切だが堅すぎない、話しやすい表現）',
    casual: '友達とのラフな会話向けの、砕けた口調'
  }

  const nativeLangName = languageNames[nativeLanguage as keyof typeof languageNames] || nativeLanguage
  const learningLangName = languageNames[learningLanguage as keyof typeof languageNames] || learningLanguage

  return `次の${nativeLangName}を、${learningLangName}のネイティブスピーカーが実際の会話で使う自然な話し言葉に翻訳してください。

選択されたスタイル：${styleDescriptions[selectedStyle]}

このスタイルで、同じ意味を持つ3つの異なる表現パターンを、話し言葉に特化した、最も自然な口語表現で出力してください。

出力形式（JSON）：
{
  "variation1": "～",
  "variation2": "～", 
  "variation3": "～"
}

JSON以外の文字は含めないでください。`
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildPrompt(nativeLanguage: string, learningLanguage: string, desiredPhrase: string): string {
  const languageNames = {
    ja: '日本語',
    en: '英語',
    ko: '韓国語',
    zh: '中国語',
    es: 'スペイン語',
    fr: 'フランス語',
    de: 'ドイツ語'
  }

  const nativeLangName = languageNames[nativeLanguage as keyof typeof languageNames] || nativeLanguage
  
  return `対象の${nativeLangName}：${desiredPhrase}`
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseGeneratedContent(content: string, selectedStyle: 'common' | 'business' | 'casual'): PhraseVariation[] {
  try {
    // JSONの部分を抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    const variations: PhraseVariation[] = []
    
    if (parsed.variation1) {
      variations.push({ type: selectedStyle, text: parsed.variation1 })
    }
    
    if (parsed.variation2) {
      variations.push({ type: selectedStyle, text: parsed.variation2 })
    }
    
    if (parsed.variation3) {
      variations.push({ type: selectedStyle, text: parsed.variation3 })
    }

    return variations

  } catch (error) {
    console.error('Error parsing generated content:', error)
    // フォールバック: 生成されたコンテンツをそのまま選択されたスタイルとして返す
    return [
      { type: selectedStyle, text: content.trim() }
    ]
  }
}
