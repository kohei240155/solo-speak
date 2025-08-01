import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    const mode = searchParams.get('mode') || 'normal'

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      )
    }

    // Promise.allを使用して並列処理でパフォーマンスを向上
    const [userSettings, languageExists, phrases] = await Promise.all([
      // ユーザー設定を取得（デフォルトクイズ出題数）
      prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: { defaultQuizCount: true }
      }),
      
      // 指定された言語が存在するか確認
      prisma.language.findUnique({
        where: { code: language }
      }),
      
      // データベースからフレーズを取得（削除されていないもののみ）
      // 認証されたユーザーのフレーズのみを取得
      prisma.phrase.findMany({
        where: {
          userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
          language: {
            code: language
          },
          deletedAt: null // 削除されていないフレーズのみ
        },
        include: {
          language: true
        }
      })
    ])

    const userDefaultQuizCount = userSettings?.defaultQuizCount || 10

    if (!languageExists) {
      return NextResponse.json({
        success: false,
        message: `Language with code '${language}' not found`
      })
    }

    if (phrases.length === 0) {
      return NextResponse.json({
        success: false,
        message: `No phrases found for the specified language: ${language}`
      })
    }

    // 実際の問題数を決定（フレーズ数とユーザー設定の小さい方）
    const actualQuestionCount = Math.min(userDefaultQuizCount, phrases.length)

    let selectedPhrases

    if (mode === 'random') {
      // ランダムモード：Fisher-Yates シャッフルを使用して確実にランダム化
      const shuffledPhrases = [...phrases]
      
      // Fisher-Yates シャッフルアルゴリズム
      for (let i = shuffledPhrases.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPhrases[i], shuffledPhrases[j]] = [shuffledPhrases[j], shuffledPhrases[i]]
      }
      
      // 重複なしで必要な数だけ選択
      selectedPhrases = shuffledPhrases.slice(0, actualQuestionCount)
    } else {
      // ノーマルモード：優先度に基づいて選択
      // 1. 正解数が少ない順
      // 2. 登録日時が古い順
      const sortedPhrases = [...phrases].sort((a, b) => {
        // 正解数で比較（少ない順）
        const correctA = a.correctQuizCount || 0
        const correctB = b.correctQuizCount || 0
        
        if (correctA !== correctB) {
          return correctA - correctB // 正解数が少ない順
        }
        
        // 正解数が同じ場合は登録日時で比較（古い順）
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateA - dateB // 古い順
      })
      
      selectedPhrases = sortedPhrases.slice(0, actualQuestionCount)
    }

    // フレーズリストを返す
    const quizPhrases = selectedPhrases.map(phrase => ({
      id: phrase.id,
      original: phrase.original,
      translation: phrase.translation,
      languageCode: phrase.language.code,
      correctQuizCount: phrase.correctQuizCount || 0
    }))

    return NextResponse.json({
      success: true,
      phrases: quizPhrases,
      totalCount: quizPhrases.length,
      availablePhraseCount: phrases.length // 登録されているフレーズの総数
    })

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
