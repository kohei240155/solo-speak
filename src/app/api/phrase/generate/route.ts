import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/utils/api-helpers'
import { getTranslation, getLocaleFromRequest } from '@/utils/api-i18n'
import { zodResponseFormat } from 'openai/helpers/zod'
import { prisma } from '@/utils/prisma'
import { getPromptTemplate } from '@/prompts'

const generatePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  desiredPhrase: z.string().min(1).max(100),
  selectedContext: z.string().nullable().optional()
})

// Structured Outputs用のレスポンススキーマ
const phraseVariationsSchema = z.object({
  variations: z.array(z.object({
    original: z.string().max(200).describe("自然な話し言葉の表現（200文字以内）"),
    explanation: z.string().describe("他の表現との違いを示すニュアンスの説明（30-50文字程度）")
  })).length(3).describe("同じ意味を持つ3つの異なる表現パターン")
})

interface PhraseVariation {
  original: string
  explanation?: string
}

interface GeneratePhraseResponse {
  variations: PhraseVariation[]
}

/** フレーズ生成APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns GeneratePhraseResponse - 生成されたフレーズのバリエーション
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストから言語を取得
    const locale = getLocaleFromRequest(request)

    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { nativeLanguage, learningLanguage, desiredPhrase, selectedContext } = generatePhraseSchema.parse(body)

    const userId = authResult.user.id

    // 生成前に残り回数をチェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        remainingPhraseGenerations: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 残り回数が0の場合はエラーを返す
    if (user.remainingPhraseGenerations <= 0) {
      return NextResponse.json(
        { error: getTranslation(locale, 'phrase.messages.dailyLimitExceeded') },
        { status: 403 }
      )
    }

    // ChatGPT API呼び出し (Structured Outputs使用)
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      )
    }

    // ChatGPT APIに送信するプロンプトを構築
    const prompt = getPromptTemplate(learningLanguage, nativeLanguage, desiredPhrase, selectedContext || undefined)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: [
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
      return NextResponse.json(
        { error: getTranslation(locale, 'phrase.messages.generationFailed') },
        { status: 500 }
      )
    }

    const data = await response.json()
    const generatedContent = data.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json(
        { error: getTranslation(locale, 'phrase.messages.noContentGenerated') },
        { status: 500 }
      )
    }

    // Structured Outputsなので直接パースできる
    const parsedResponse = phraseVariationsSchema.parse(JSON.parse(generatedContent))
    
    // レスポンス形式を既存のインターフェースに変換
    const variations: PhraseVariation[] = parsedResponse.variations.map(variation => ({
      original: variation.original,
      explanation: variation.explanation
    }))

    const result: GeneratePhraseResponse = {
      variations
    }

    // フレーズ生成が成功した場合、生成回数を減らす
    try {
      // 回数を1減らして更新
      await prisma.user.update({
        where: { id: userId },
        data: {
          remainingPhraseGenerations: user.remainingPhraseGenerations - 1,
          lastPhraseGenerationDate: new Date()
        }
      })
      } catch {
        // エラーがあっても生成は完了しているため、カウント更新エラーを警告レベルで扱う
      }    return NextResponse.json(result)

  } catch (error) {
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
