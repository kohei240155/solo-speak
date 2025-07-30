import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { authenticateRequest } from '@/utils/api-helpers'
import { zodResponseFormat } from 'openai/helpers/zod'
import { prisma } from '@/utils/prisma'

const generatePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  desiredPhrase: z.string().min(1).max(100),
  useChatGptApi: z.boolean().default(false),
  selectedContext: z.string().nullable().optional()
})

// Structured Outputs用のレスポンススキーマ
const phraseVariationsSchema = z.object({
  variations: z.array(z.object({
    text: z.string().max(200).describe("自然な話し言葉の表現（200文字以内）"),
    explanation: z.string().describe("他の表現との違いを示すニュアンスの説明（30-50文字程度）")
  })).length(3).describe("同じ意味を持つ3つの異なる表現パターン")
})

interface PhraseVariation {
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
    const { nativeLanguage, learningLanguage, desiredPhrase, useChatGptApi, selectedContext } = generatePhraseSchema.parse(body)

    const userId = authResult.user.id

    // ChatGPT APIを使用するかどうかで分岐
    if (useChatGptApi) {
      // 生成前に残り回数をチェック
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          remainingPhraseGenerations: true,
          lastPhraseGenerationDate: true
        }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // 日付リセットロジック
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      let remainingGenerations = user.remainingPhraseGenerations

      if (!user.lastPhraseGenerationDate) {
        // 初回の場合は5回に設定
        remainingGenerations = 5
        await prisma.user.update({
          where: { id: userId },
          data: {
            remainingPhraseGenerations: 5,
            lastPhraseGenerationDate: new Date()
          }
        })
      } else {
        const lastGenerationDay = new Date(user.lastPhraseGenerationDate)
        lastGenerationDay.setHours(0, 0, 0, 0)
        
        // 最後の生成日が今日より前の場合のみリセット
        if (lastGenerationDay.getTime() < today.getTime()) {
          remainingGenerations = 5
          await prisma.user.update({
            where: { id: userId },
            data: {
              remainingPhraseGenerations: 5,
              lastPhraseGenerationDate: new Date()
            }
          })
        }
      }

      // 残り回数が0の場合はエラーを返す
      if (remainingGenerations <= 0) {
        return NextResponse.json(
          { error: '本日の生成回数を超過しました。明日再度お試しください。' },
          { status: 403 }
        )
      }

      // ===== ChatGPT API呼び出し (Structured Outputs使用) =====
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
          { error: 'OpenAI API key is not configured' },
          { status: 500 }
        )
      }

      // ChatGPT APIに送信するプロンプトを構築
      const { prompt, situation } = buildPrompt(nativeLanguage, learningLanguage, desiredPhrase, selectedContext)

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
              content: getSystemPrompt(nativeLanguage, learningLanguage, situation)
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
        text: variation.text,
        explanation: variation.explanation
      }))

      // ChatGPT APIを使用した場合のみ、フレーズ生成回数を減らす
      try {
        // 回数を1減らして更新
        await prisma.user.update({
          where: { id: userId },
          data: {
            remainingPhraseGenerations: remainingGenerations - 1,
            lastPhraseGenerationDate: new Date()
          }
        })
      } catch (error) {
        console.warn('Error updating phrase generation count:', error)
      }

      const result: GeneratePhraseResponse = {
        variations
      }

      return NextResponse.json(result)
    } else {
      // テスト用: 固定の応答を返す
      const result: GeneratePhraseResponse = {
        variations: getMockVariations()
      }
      return NextResponse.json(result)
    }

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

// テスト用の固定レスポンス関数
function getMockVariations(): PhraseVariation[] {
  return [
    {
      text: 'I want to go see fireworks tomorrow.',
      explanation: '最も直接的な表現。自分の意思をはっきりと伝える標準的な言い回し。'
    },
    {
      text: "I'm thinking of going to see the fireworks tomorrow.",
      explanation: '少し控えめな表現。「考えている」という言葉で、まだ完全には決めていないニュアンスを含む。'
    },
    {
      text: "I'd like to check out the fireworks tomorrow.",
      explanation: 'カジュアルで親しみやすい表現。「check out」を使うことでよりリラックスした雰囲気を演出。'
    }
  ]
}

// ===== ChatGPT API関連関数 (本番用に保持) =====

function getSystemPrompt(nativeLanguage: string, learningLanguage: string, situation?: string): string {
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

  // シチュエーションが指定されている場合の追加指示
  const situationInstruction = situation 
    ? `\n\n【特定シチュエーション】：${situation}\n上記のシチュエーションに最適で、その場面で実際に使われる自然な表現を生成してください。そのシチュエーションの文脈や雰囲気を十分に考慮し、その場面にふさわしい言葉選びや話し方を反映させてください。`
    : '';

  return `あなたは言語学習のサポートを行う専門家です。次の${nativeLangName}を、${learningLangName}のネイティブスピーカーが実際の会話で使う自然な話し言葉に翻訳してください。${situationInstruction}

${situation ? 'このシチュエーションに最適で、その場面で実際に使われる' : ''}同じ意味を持つ3つの異なる表現パターンを、話し言葉に特化した最も自然な口語表現で生成してください。${situation ? 'シチュエーションの文脈や雰囲気を十分に考慮し、その場面にふさわしい言葉選びや話し方を反映させてください。' : ''}

【重要】各表現には必ずニュアンスの説明を付けてください：
- 他の2つの表現と比較してどのような違いがあるかを明確に説明する
- 説明は30-50文字程度の簡潔な表現にする
- 「〜な表現」「〜なニュアンス」「〜な雰囲気」などの形で記述する${situation ? '\n- このシチュエーションでの使用場面や適切さも説明に含める' : ''}

【文字数制限】生成する各表現は200文字以内に収めてください。簡潔で自然な表現を心がけてください。`
}

function buildPrompt(nativeLanguage: string, learningLanguage: string, desiredPhrase: string, selectedContext?: string | null): { prompt: string; situation?: string } {
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
  const bracketSituation = situationMatch ? situationMatch[1] : undefined;
  
  // selectedContextを優先し、なければ括弧内のシチュエーションを使用
  // nullの場合はundefinedとして扱う
  const situation = selectedContext || bracketSituation;
  
  // シチュエーション部分を除いたフレーズを取得
  const cleanPhrase = desiredPhrase.replace(/\([^)]*\)/g, '').trim();
  
  return {
    prompt: `対象の${nativeLangName}：${cleanPhrase}`,
    situation
  };
}
