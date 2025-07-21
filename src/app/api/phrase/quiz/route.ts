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
    const questionCount = parseInt(searchParams.get('count') || '10', 10)

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      )
    }

    // データベースからフレーズを取得（削除されていないもののみ）
    // 認証されたユーザーのフレーズのみを取得
    const phrases = await prisma.phrase.findMany({
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

    if (phrases.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No phrases found for the specified language'
      })
    }

    // 最低1つのフレーズがあれば実行可能
    if (phrases.length < 1) {
      return NextResponse.json({
        success: false,
        message: 'At least 1 phrase is required for quiz mode'
      })
    }

    let selectedPhrases

    if (mode === 'random') {
      // ランダムモード：ランダムに選択
      const shuffledPhrases = [...phrases].sort(() => Math.random() - 0.5)
      selectedPhrases = shuffledPhrases.slice(0, Math.min(questionCount, phrases.length))
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
      
      selectedPhrases = sortedPhrases.slice(0, Math.min(questionCount, phrases.length))
    }

    // フレーズリストを返す
    const quizPhrases = selectedPhrases.map(phrase => ({
      id: phrase.id,
      text: phrase.text,
      translation: phrase.translation,
      languageCode: phrase.language.code,
      correctQuizCount: phrase.correctQuizCount || 0
    }))

    return NextResponse.json({
      success: true,
      phrases: quizPhrases,
      totalCount: quizPhrases.length
    })

  } catch (error) {
    console.error('Error fetching quiz phrases:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
