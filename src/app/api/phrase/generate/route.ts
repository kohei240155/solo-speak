import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/utils/api-helpers'
import { zodResponseFormat } from 'openai/helpers/zod'

const generatePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  desiredPhrase: z.string().min(1).max(100),
  selectedStyle: z.enum(['common', 'business', 'casual']),
  useChatGptApi: z.boolean().default(false)
})

// Structured Outputs用のレスポンススキーマ
const phraseVariationsSchema = z.object({
  variations: z.array(z.object({
    text: z.string().max(200).describe("自然な話し言葉の表現（200文字以内）"),
    explanation: z.string().describe("他の表現との違いを示すニュアンスの説明（30-50文字程度）")
  })).length(3).describe("同じ意味を持つ3つの異なる表現パターン")
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
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { nativeLanguage, learningLanguage, desiredPhrase, selectedStyle, useChatGptApi } = generatePhraseSchema.parse(body)

    // ChatGPT APIを使用するかどうかで分岐
    if (useChatGptApi) {
      // ===== ChatGPT API呼び出し (Structured Outputs使用) =====
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key is not configured' },
          { status: 500 }
        )
      }

      // ChatGPT APIに送信するプロンプトを構築
      const { prompt, situation } = buildPrompt(nativeLanguage, learningLanguage, desiredPhrase)

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
              content: getSystemPrompt(nativeLanguage, learningLanguage, selectedStyle, situation)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          // Structured Outputs使用
          response_format: zodResponseFormat(phraseVariationsSchema, "phrase_variations")
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

      // Structured Outputsなので直接パースできる
      const parsedResponse = phraseVariationsSchema.parse(JSON.parse(generatedContent))
      
      // レスポンス形式を既存のインターフェースに変換
      const variations: PhraseVariation[] = parsedResponse.variations.map(variation => ({
        type: selectedStyle,
        text: variation.text,
        explanation: variation.explanation
      }))

      const result: GeneratePhraseResponse = {
        variations
      }

      return NextResponse.json(result)
    } else {
      // テスト用: 固定の応答を返す
      const result: GeneratePhraseResponse = {
        variations: getMockVariations(selectedStyle)
      }
      return NextResponse.json(result)
    }

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
      explanation: '最も直接的な表現。自分の意思をはっきりと伝える標準的な言い回し。'
    },
    {
      type: selectedStyle,
      text: "I'm thinking of going to see the fireworks tomorrow.",
      explanation: '少し控えめな表現。「考えている」という言葉で、まだ完全には決めていないニュアンスを含む。'
    },
    {
      type: selectedStyle,
      text: "I'd like to check out the fireworks tomorrow.",
      explanation: 'カジュアルで親しみやすい表現。「check out」を使うことでよりリラックスした雰囲気を演出。'
    }
  ]
}

// ===== ChatGPT API関連関数 (本番用に保持) =====

function getSystemPrompt(nativeLanguage: string, learningLanguage: string, selectedStyle: 'common' | 'business' | 'casual', situation?: string): string {
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

  // シチュエーションが指定されている場合の追加指示
  const situationInstruction = situation 
    ? `\n\n【特定シチュエーション】：${situation}\n上記のシチュエーションに最適で、その場面で実際に使われる自然な表現を生成してください。そのシチュエーションの文脈や雰囲気を十分に考慮し、その場面にふさわしい言葉選びや話し方を反映させてください。`
    : '';

  return `あなたは言語学習のサポートを行う専門家です。次の${nativeLangName}を、${learningLangName}のネイティブスピーカーが実際の会話で使う自然な話し言葉に翻訳してください。

選択されたスタイル：${styleDescriptions[selectedStyle]}${situationInstruction}

このスタイル${situation ? 'とシチュエーション' : ''}に適した、同じ意味を持つ3つの異なる表現パターンを、話し言葉に特化した最も自然な口語表現で生成してください。

【重要】各表現には必ずニュアンスの説明を付けてください：
- 他の2つの表現と比較してどのような違いがあるかを明確に説明する
- 説明は30-50文字程度の簡潔な表現にする
- 「〜な表現」「〜なニュアンス」「〜な雰囲気」などの形で記述する${situation ? '\n- シチュエーションにおける使用場面や適切さも説明に含める' : ''}

【文字数制限】生成する各表現は200文字以内に収めてください。簡潔で自然な表現を心がけてください。`
}

function buildPrompt(nativeLanguage: string, learningLanguage: string, desiredPhrase: string): { prompt: string; situation?: string } {
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
  
  // 括弧内のシチュエーションを抽出
  const situationMatch = desiredPhrase.match(/\(([^)]+)\)/);
  const situation = situationMatch ? situationMatch[1] : undefined;
  
  // シチュエーション部分を除いたフレーズを取得
  const cleanPhrase = desiredPhrase.replace(/\([^)]*\)/g, '').trim();
  
  return {
    prompt: `対象の${nativeLangName}：${cleanPhrase}`,
    situation
  };
}
