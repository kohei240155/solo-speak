import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    const order = searchParams.get('order') || 'new_to_old'
    const prioritizeLowReadCount = searchParams.get('prioritizeLowReadCount') === 'true'

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      )
    }

    // モード設定をクエリパラメータから取得
    const config = {
      order,
      prioritizeLowReadCount
    }

    // データベースからフレーズを取得
    const phrases = await prisma.phrase.findMany({
      where: {
        language: {
          code: language
        }
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

    // ソート処理
    const sortedPhrases = [...phrases]

    // 低い音読回数を優先する場合
    if (config.prioritizeLowReadCount) {
      sortedPhrases.sort((a, b) => (a.totalReadCount || 0) - (b.totalReadCount || 0))
    }

    // 日付順でソート
    if (config.order === 'new_to_old') {
      sortedPhrases.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        if (config.prioritizeLowReadCount) {
          // 音読回数が同じ場合のみ日付でソート
          const practiceA = a.totalReadCount || 0
          const practiceB = b.totalReadCount || 0
          if (practiceA === practiceB) {
            return dateB - dateA // 新しい順
          }
          return 0 // 音読回数優先
        }
        return dateB - dateA
      })
    } else {
      sortedPhrases.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime()
        const dateB = new Date(b.createdAt).getTime()
        if (config.prioritizeLowReadCount) {
          const practiceA = a.totalReadCount || 0
          const practiceB = b.totalReadCount || 0
          if (practiceA === practiceB) {
            return dateA - dateB // 古い順
          }
          return 0
        }
        return dateA - dateB
      })
    }

    // 最初のフレーズを返す
    const firstPhrase = sortedPhrases[0]

    // 今日の音読回数を計算
    const dailyReadCount = firstPhrase.dailyReadCount || 0

    return NextResponse.json({
      success: true,
      phrase: {
        id: firstPhrase.id,
        text: firstPhrase.text,
        translation: firstPhrase.translation,
        totalReadCount: firstPhrase.totalReadCount || 0,
        dailyReadCount: dailyReadCount,
        languageCode: firstPhrase.language.code
      }
    })

  } catch (error) {
    console.error('Error fetching speak phrase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
