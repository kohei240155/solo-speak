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

    // 少なくとも4つのフレーズが必要（選択肢作成のため）
    if (phrases.length < 4) {
      return NextResponse.json({
        success: false,
        message: 'At least 4 phrases are required for quiz mode'
      })
    }

    let selectedPhrase

    if (mode === 'random') {
      // ランダムモード：ランダムに選択
      const randomIndex = Math.floor(Math.random() * phrases.length)
      selectedPhrase = phrases[randomIndex]
    } else {
      // ノーマルモード：作成日時順（新しい順）
      const sortedPhrases = [...phrases].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        return dateB - dateA // 新しい順
      })
      selectedPhrase = sortedPhrases[0]
    }

    // 選択肢を作成（正解を含む4つの選択肢）
    const otherPhrases = phrases.filter(p => p.id !== selectedPhrase.id)
    
    // 他のフレーズからランダムに3つ選択
    const wrongOptions = []
    const shuffledOthers = [...otherPhrases].sort(() => Math.random() - 0.5)
    
    for (let i = 0; i < Math.min(3, shuffledOthers.length); i++) {
      wrongOptions.push(shuffledOthers[i].translation)
    }

    // 正解と不正解の選択肢を混ぜる
    const allOptions = [selectedPhrase.translation, ...wrongOptions]
    const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      success: true,
      phrase: {
        id: selectedPhrase.id,
        text: selectedPhrase.text,
        translation: selectedPhrase.translation,
        options: shuffledOptions,
        correctAnswer: selectedPhrase.translation,
        languageCode: selectedPhrase.language.code
      }
    })

  } catch (error) {
    console.error('Error fetching quiz phrase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
