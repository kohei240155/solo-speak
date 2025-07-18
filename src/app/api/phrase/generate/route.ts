import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const generatePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  desiredPhrase: z.string().min(1).max(200),
})

interface PhraseVariation {
  type: 'common' | 'polite' | 'casual'
  text: string
  explanation?: string
}

interface GeneratePhraseResponse {
  variations: PhraseVariation[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nativeLanguage, learningLanguage, desiredPhrase } = generatePhraseSchema.parse(body)

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
            content: getSystemPrompt(nativeLanguage, learningLanguage)
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
    const variations = parseGeneratedContent(generatedContent)

    const result: GeneratePhraseResponse = {
      variations
    }

    return NextResponse.json(result)

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

function getSystemPrompt(nativeLanguage: string, learningLanguage: string): string {
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
  const learningLangName = languageNames[learningLanguage as keyof typeof languageNames] || learningLanguage

  return `あなたは語学学習をサポートするAIアシスタントです。
ユーザーが${nativeLangName}で話したいことを${learningLangName}で表現するのを手伝います。

以下のルールに従って回答してください：
1. 一般的（Common）、丁寧（Polite）、カジュアル（Casual）の3つのバリエーションを提供する
2. 各バリエーションは自然で実用的な表現にする
3. 文化的に適切で、ネイティブスピーカーが実際に使う表現を選ぶ
4. 応答は以下のJSON形式で返す：

{
  "common": "一般的な表現",
  "polite": "丁寧な表現", 
  "casual": "カジュアルな表現"
}

JSON以外の文字は含めないでください。`
}

function buildPrompt(nativeLanguage: string, learningLanguage: string, desiredPhrase: string): string {
  return `以下のフレーズを適切に翻訳してください：

「${desiredPhrase}」

上記のフレーズを3つのスタイル（一般的、丁寧、カジュアル）で表現してください。`
}

function parseGeneratedContent(content: string): PhraseVariation[] {
  try {
    // JSONの部分を抽出
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    const variations: PhraseVariation[] = []
    
    if (parsed.common) {
      variations.push({ type: 'common', text: parsed.common })
    }
    
    if (parsed.polite) {
      variations.push({ type: 'polite', text: parsed.polite })
    }
    
    if (parsed.casual) {
      variations.push({ type: 'casual', text: parsed.casual })
    }

    return variations

  } catch (error) {
    console.error('Error parsing generated content:', error)
    // フォールバック: 生成されたコンテンツをそのまま一般的な表現として返す
    return [
      { type: 'common', text: content.trim() }
    ]
  }
}
